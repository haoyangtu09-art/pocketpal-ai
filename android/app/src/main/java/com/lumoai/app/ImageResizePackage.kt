package com.lumoai.app

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.lumoai.app.specs.NativeImageResizeSpec

class ImageResizePackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == NativeImageResizeSpec.NAME) {
            ImageResizeModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeImageResizeSpec.NAME to ReactModuleInfo(
                    NativeImageResizeSpec.NAME,
                    NativeImageResizeSpec.NAME,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    false, // hasConstants
                    false, // isCxxModule
                    true   // isTurboModule
                )
            )
        }
    }
}
