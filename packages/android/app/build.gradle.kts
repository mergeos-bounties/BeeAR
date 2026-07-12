plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.beear.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.beear.app"
        minSdk = 23
        targetSdk = 35
        versionCode = 2
        versionName = "0.2.0"
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":beear-webview"))
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")

    testImplementation("junit:junit:4.13.2")
}
