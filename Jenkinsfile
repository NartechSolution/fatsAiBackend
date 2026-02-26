pipeline {
    agent any

    environment {
        ENV_FILE_PATH = "C:\\Program Files\\Jenkins\\jenkinsEnv\\fatsAI\\.env"
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder logRotator(
            artifactDaysToKeepStr: '',
            artifactNumToKeepStr: '5',
            daysToKeepStr: '',
            numToKeepStr: '5'
        )
    }

    triggers {
        // Trigger build on pushes (GitHub plugin + webhook)
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📦 Cloning fatsAiBackend repository..."
                checkout scmGit(
                    branches: [[name: '*/main']],
                    extensions: [],
                    userRemoteConfigs: [[
                        credentialsId: 'eissa',
                        url: 'https://github.com/NartechSolution/fatsAiBackend.git'
                    ]]
                )
            }
        }

        stage('Setup Environment File') {
            steps {
                echo "📁 Copying .env file to the backend root..."
                bat "copy \"${ENV_FILE_PATH}\" \"%WORKSPACE%\\.env\""
            }
        }

        stage('Install & Generate Prisma') {
            steps {
                echo "📦 Installing dependencies..."
                bat 'npm install'

                echo "🔨 Generating Prisma client..."
                bat 'npx prisma generate'
            }
        }
    }

    post {
        success {
            echo "✅ Build completed successfully!"
        }
        failure {
            echo "❌ Build failed!"
        }
    }
}
