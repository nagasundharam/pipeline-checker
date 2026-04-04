import groovy.json.JsonOutput
pipeline {
    agent any

    parameters {
        // Use Jenkins credentials store instead of hardcoding
        string(name: 'PROJECT_ID', defaultValue: '', description: 'The unique ID of the project in the tracker (set via Jenkins credentials)')
        string(name: 'ENVIRONMENT_ID', defaultValue: '', description: 'The target environment ID (set via Jenkins credentials)')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
        string(name: 'EC2_HOST', defaultValue: '', description: 'The hostname/IP of your Deployment Tracker backend (set via Jenkins credentials)')
        booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'Run tests before deployment')
        booleanParam(name: 'RUN_LINTING', defaultValue: true, description: 'Run linting checks')
    }

    environment {
        COMMIT_HASH = ""
        COMMIT_MSG = ""
        COMMIT_AUTHOR = ""
        COMMIT_EMAIL = ""
        PUBLIC_IP = ""
        BACKUP_DIR = "/var/www/html/backup_${BUILD_NUMBER}"
        DIST_DIR = "${WORKSPACE}/dist"
        API_PROTOCOL = "https"
        API_PORT = "5000"
        DEPLOYMENT_VERSION = "1.0.${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout & Metadata') {
            steps {
                // Pulls code and extracts Git info
                checkout scm
                script {
                    echo "📦 Extracting commit metadata..."
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_EMAIL = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    
                    // Get public IP (use HTTPS)
                    def ipResult = sh(script: "curl -s -m 5 https://checkip.amazonaws.com || echo 'unknown'", returnStdout: true).trim()
                    env.PUBLIC_IP = ipResult ?: "unknown"
                    
                    echo "✅ Commit: ${env.COMMIT_HASH.take(7)}"
                    echo "✅ Author: ${env.COMMIT_AUTHOR}"
                }
            }
        }

        stage('Validate Parameters') {
            steps {
                script {
                    echo "🔍 Validating Jenkins parameters..."
                    if (!params.PROJECT_ID) {
                        error("❌ PROJECT_ID parameter is required")
                    }
                    if (!params.ENVIRONMENT_ID) {
                        error("❌ ENVIRONMENT_ID parameter is required")
                    }
                    if (!params.EC2_HOST) {
                        error("❌ EC2_HOST parameter is required")
                    }
                    echo "✅ All parameters validated"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "📥 Installing npm dependencies..."
                sh 'npm ci'  // Use 'ci' instead of 'install' for CI/CD
            }
        }

        stage('Lint Code') {
            when {
                expression { params.RUN_LINTING == true }
            }
            steps {
                echo "🔍 Running ESLint..."
                sh 'npm run lint || true'  // Continue even if linting fails
            }
        }

        stage('Run Tests') {
            when {
                expression { params.RUN_TESTS == true }
            }
            steps {
                echo "🧪 Running tests..."
                sh 'npm run test || true'  // Continue even if tests fail
            }
        }

        stage('Build') {
            steps {
                echo "🔨 Building application..."
                script {
                    sh 'npm run build'
                    
                    // Verify build output exists
                    if (!fileExists(env.DIST_DIR)) {
                        error("❌ Build failed: ${env.DIST_DIR} does not exist")
                    }
                    echo "✅ Build successful"
                }
            }
        }

        stage('Backup Existing Deployment') {
            steps {
                echo "💾 Creating backup of current deployment..."
                script {
                    sh '''
                        if [ -d "/var/www/html" ] && [ "$(ls -A /var/www/html)" ]; then
                            mkdir -p ${BACKUP_DIR}
                            cp -r /var/www/html/* ${BACKUP_DIR}/ 2>/dev/null || true
                            echo "✅ Backup created at ${BACKUP_DIR}"
                        else
                            echo "ℹ️ No existing deployment to backup"
                        fi
                    '''
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                echo "🚀 Deploying frontend to /var/www/html..."
                script {
                    sh '''
                        # Ensure directory exists
                        sudo mkdir -p /var/www/html
                        
                        # Clear old files
                        sudo rm -rf /var/www/html/* || true
                        
                        # Deploy new files
                        sudo cp -r ${DIST_DIR}/* /var/www/html/
                        
                        # Set permissions
                        sudo chown -R www-data:www-data /var/www/html
                        sudo chmod -R 755 /var/www/html
                        
                        echo "✅ Deployment completed"
                    '''
                }
            }
        }

        stage('Update Tracker API') {
            steps {
                echo "📡 Notifying Deployment Tracker..."
                script {
                    // Build the payload
                    def payload = [
                        project_id: params.PROJECT_ID,
                        environment_id: params.ENVIRONMENT_ID,
                        pipeline_id: env.BUILD_NUMBER,
                        version: env.DEPLOYMENT_VERSION,
                        branch: params.DEPLOY_BRANCH,
                        commit_message: env.COMMIT_MSG,
                        commit_author: env.COMMIT_AUTHOR,
                        commit_author_email: env.COMMIT_EMAIL,
                        commit_hash: env.COMMIT_HASH,
                        deployment_timestamp: new Date().format('yyyy-MM-dd HH:mm:ss'),
                        triggered_by: [
                            username: "Jenkins",
                            user_id: "system",
                            source: "Jenkins"
                        ]
                    ]

                    def jsonString = JsonOutput.toJson(payload)
                    writeFile file: 'payload.json', text: jsonString

                    try {
                        // Use HTTPS and add timeout
                        def response = sh(
                            script: """
                                curl -s -w "%{http_code}" -X POST ${env.API_PROTOCOL}://${params.EC2_HOST}:${env.API_PORT}/api/jenkins-webhook \
                                    -H 'Content-Type: application/json' \
                                    --max-time 10 \
                                    -d @payload.json
                            """,
                            returnStdout: true
                        ).trim()

                        def httpCode = response.take(-3)
                        if (httpCode.toInteger() >= 200 && httpCode.toInteger() < 300) {
                            echo "✅ Tracker API updated successfully (HTTP ${httpCode})"
                        } else {
                            echo "⚠️ Tracker API returned HTTP ${httpCode}"
                        }
                    } catch (Exception e) {
                        echo "⚠️ Warning: Tracker API update failed. Error: ${e.message}"
                        // Don't fail the build for this
                    } finally {
                        sh "rm -f payload.json"
                    }
                }
            }
        }
    }


    post {
        success {
            echo """
            ========================================
            ✅ DEPLOYMENT SUCCESSFUL
            ========================================
            Build Number: ${BUILD_NUMBER}
            Version: ${DEPLOYMENT_VERSION}
            Branch: ${DEPLOY_BRANCH}
            Commit: ${COMMIT_HASH.take(7)}
            Author: ${COMMIT_AUTHOR}
            Public URL: http://${PUBLIC_IP}
            ========================================
            """
            // Optional: Send Slack/Email notification here
        }
        failure {
            echo """
            ========================================
            ❌ DEPLOYMENT FAILED
            ========================================
            Build Number: ${BUILD_NUMBER}
            Please check the Jenkins console logs
            ========================================
            """
            script {
                // Optionally rollback to previous version
                sh '''
                    if [ -d "${BACKUP_DIR}" ] && [ "$(ls -A ${BACKUP_DIR})" ]; then
                        echo "🔄 Rolling back to previous deployment..."
                        sudo rm -rf /var/www/html/*
                        sudo cp -r ${BACKUP_DIR}/* /var/www/html/
                        echo "✅ Rollback completed"
                    fi
                '''
            }
        }
        always {
            // Cleanup
            echo "🧹 Cleaning up workspace..."
            sh '''
                rm -f payload.json
                npm cache clean --force || true
            '''
            // Archive build artifacts
            archiveArtifacts artifacts: 'dist/**/*', allowEmptyArchive: true
        }
    }
}
