plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("maven-publish")
}

val libVersion = "0.4.0"
val libGroup = "com.beear"
val libArtifact = "beear-webview"

android {
    namespace = "com.beear.webview"
    compileSdk = 35

    defaultConfig {
        minSdk = 23
        consumerProguardFiles("consumer-rules.pro")
        // BuildConfig fields for host apps
        buildConfigField("String", "LIBRARY_VERSION", "\"$libVersion\"")
        buildConfigField("String", "DEFAULT_TRYON_URL", "\"http://localhost:8860/\"")
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.fragment:fragment-ktx:1.8.5")
    implementation("androidx.appcompat:appcompat:1.7.0")

    testImplementation("junit:junit:4.13.2")
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                groupId = libGroup
                artifactId = libArtifact
                version = libVersion
                from(components["release"])
                pom {
                    name.set("BeeAR WebView")
                    description.set("Android library for BeeAR virtual try-on (WebView + camera bridge)")
                    url.set("https://github.com/mergeos-bounties/BeeAR")
                    licenses {
                        license {
                            name.set("MIT License")
                            url.set("https://opensource.org/licenses/MIT")
                        }
                    }
                    scm {
                        url.set("https://github.com/mergeos-bounties/BeeAR")
                        connection.set("scm:git:https://github.com/mergeos-bounties/BeeAR.git")
                    }
                }
            }
        }
        repositories {
            maven {
                name = "LocalRelease"
                url = uri(rootProject.layout.buildDirectory.dir("repo"))
            }
            // GitHub Packages (Maven) — set GITHUB_ACTOR + GITHUB_TOKEN to publish
            maven {
                name = "GitHubPackages"
                url = uri("https://maven.pkg.github.com/mergeos-bounties/BeeAR")
                credentials {
                    username = System.getenv("GITHUB_ACTOR") ?: "token"
                    password = System.getenv("GITHUB_TOKEN") ?: System.getenv("GH_TOKEN") ?: ""
                }
            }
        }
    }
}

