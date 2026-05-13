package com.operyx.app.plugins

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.PluginMethod
import java.io.ByteArrayOutputStream
import java.nio.charset.Charset
import java.util.UUID

@CapacitorPlugin(name = "OperyxPrinter")
class OperyxPrinterPlugin : Plugin() {
  private val sppUuid: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
  private val prefs by lazy { context.getSharedPreferences("operyx_printer", 0) }

  @PluginMethod
  fun scanPrinters(call: PluginCall) {
    runAsync(call) {
      val adapter = BluetoothAdapter.getDefaultAdapter()
        ?: throw IllegalStateException("Bluetooth non disponible sur cet appareil")
      val items = JSArray()
      adapter.bondedDevices
        .sortedWith(compareBy<BluetoothDevice>({ it.name ?: "" }, { it.address }))
        .forEach { device ->
          items.put(deviceToJson(device))
        }
      JSObject().put("items", items)
    }
  }

  @PluginMethod
  fun savePrinter(call: PluginCall) {
    val target = call.getString("target")?.trim().orEmpty()
    if (target.isBlank()) {
      call.reject("Le target Bluetooth est obligatoire.", "target_missing")
      return
    }
    val printer = JSObject()
      .put("target", target)
      .put("name", call.getString("name")?.trim().orEmpty())
      .put("type", call.getString("type")?.trim().orEmpty().ifBlank { "bluetooth" })
    prefs.edit()
      .putString("target", target)
      .putString("name", printer.getString("name"))
      .putString("type", printer.getString("type"))
      .apply()
    call.resolve(printer)
  }

  @PluginMethod
  fun getSavedPrinter(call: PluginCall) {
    call.resolve(
      JSObject()
        .put("target", prefs.getString("target", "") ?: "")
        .put("name", prefs.getString("name", "") ?: "")
        .put("type", prefs.getString("type", "bluetooth") ?: "bluetooth")
    )
  }

  @PluginMethod
  fun printTestLabel(call: PluginCall) {
    printLabelFromCall(call, true)
  }

  @PluginMethod
  fun printLabel(call: PluginCall) {
    printLabelFromCall(call, false)
  }

  private fun printLabelFromCall(call: PluginCall, testMode: Boolean) {
    runAsync(call) {
      val payload = call.getObject("label") ?: JSObject()
      val target = resolveTarget(call)
      val bytes = buildLabelBytes(payload, call.getString("name"), testMode)
      val result = printBytesToTarget(target, bytes)
      JSObject()
        .put("ok", true)
        .put("target", result.address)
        .put("name", result.name)
    }
  }

  private fun resolveTarget(call: PluginCall): String {
    val direct = call.getString("target")?.trim().orEmpty()
    if (direct.isNotBlank()) return direct
    val saved = prefs.getString("target", "")?.trim().orEmpty()
    if (saved.isNotBlank()) return saved
    throw IllegalStateException("Aucune imprimante Bluetooth enregistrée")
  }

  private fun deviceToJson(device: BluetoothDevice): JSObject {
    return JSObject()
      .put("target", device.address)
      .put("name", device.name ?: device.address)
      .put("address", device.address)
      .put("type", "bluetooth")
  }

  private data class PrintResult(val address: String, val name: String)

  @SuppressLint("MissingPermission")
  private fun printBytesToTarget(target: String, bytes: ByteArray): PrintResult {
    val adapter = BluetoothAdapter.getDefaultAdapter()
      ?: throw IllegalStateException("Bluetooth non disponible sur cet appareil")
    val device = adapter.getRemoteDevice(target)
    val socket: BluetoothSocket = device.createRfcommSocketToServiceRecord(sppUuid)
    adapter.cancelDiscovery()
    socket.use { opened ->
      opened.connect()
      opened.outputStream.use { output ->
        output.write(bytes)
        output.flush()
      }
    }
    return PrintResult(device.address, device.name ?: device.address)
  }

  private fun buildLabelBytes(label: JSObject, printerName: String?, testMode: Boolean): ByteArray {
    val printer = printerName?.trim().orEmpty().ifBlank { "Operyx" }
    val title = label.optString("title").trim().ifBlank { if (testMode) "DLC TEST" else "ETIQUETTE" }
    val product = label.optString("item_name").trim().ifBlank { if (testMode) "Produit de test" else "Produit" }
    val batch = label.optString("batch_number").trim().ifBlank { "N/A" }
    val quantity = label.optString("quantity").trim().ifBlank { "1" }
    val unit = label.optString("unit").trim().ifBlank { "piece" }
    val area = label.optString("storage_area").trim().ifBlank { "Froid" }
    val temperature = label.optString("conservation_temperature").trim().ifBlank { "0 C a 4 C" }
    val notes = label.optString("notes").trim()

    val stream = ByteArrayOutputStream()
    stream.write(byteArrayOf(0x1B, 0x40))
    stream.write(byteArrayOf(0x1B, 0x61, 0x01))
    writeLine(stream, printer)
    writeLine(stream, title)
    stream.write(byteArrayOf(0x1B, 0x61, 0x00))
    writeLine(stream, "Produit: $product")
    writeLine(stream, "Lot: $batch")
    writeLine(stream, "Quantite: $quantity $unit")
    writeLine(stream, "Zone: $area")
    writeLine(stream, "Temp: $temperature")
    if (notes.isNotBlank()) {
      writeLine(stream, "Notes: $notes")
    }
    stream.write(byteArrayOf(0x0A, 0x0A))
    stream.write(byteArrayOf(0x1D, 0x56, 0x00))
    return stream.toByteArray()
  }

  private fun writeLine(stream: ByteArrayOutputStream, value: String) {
    stream.write(value.toByteArray(Charset.forName("UTF-8")))
    stream.write(0x0A)
  }

  private fun runAsync(call: PluginCall, block: () -> JSObject) {
    Thread {
      try {
        val result = block()
        activity?.runOnUiThread {
          call.resolve(result)
        }
      } catch (error: Throwable) {
        activity?.runOnUiThread {
          call.reject(error.message ?: "Operyx printer error")
        }
      }
    }.start()
  }
}
