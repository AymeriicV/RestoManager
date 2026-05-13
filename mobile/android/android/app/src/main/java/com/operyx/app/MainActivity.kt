package com.operyx.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.operyx.app.plugins.OperyxPrinterPlugin

class MainActivity : BridgeActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    registerPlugin(OperyxPrinterPlugin::class.java)
  }
}
