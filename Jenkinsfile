pipeline {
    agent any

    parameters {
        // Replace defaultValue with the REAL IDs from the Tracker UI's "Jenkins configuration" card
        string(name: 'PROJECT_ID', defaultValue: '69ce6897557b3606c5b165ec', description: 'The unique ID of the project in the tracker')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69ce68b3557b3606c5b165fb', description: 'The target environment ID')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
        string(name: 'EC2_HOST', defaultValue: '34.204.195.105', description: 'The IP/Host of your Deployment Tracker backend')
    }

    environment {
        COMMIT_HASH = ""
        COMMIT_MSG = ""
        COMMIT_AUTHOR = ""
        COMMIT_EMAIL = ""
        PUBLIC_IP = ""
    }

    stages {
        stage('Checkout & Metadata') {
            steps {
                // Pulls code and extracts Git info
                checkout scm
                script {
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_EMAIL = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    // Optional: Get IP if you want to show it in logs
                    env.PUBLIC_IP = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()
                }
            }
        }

        stage('Install & Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('Deploy Frontend') {
            steps {
                // Replace with your actual deployment command (e.g., cp to /var/www/html or docker push)
                sh 'cp -r dist/* /var/www/html/'
                echo "Deployment finished. App is live at http://${env.PUBLIC_IP}"
            }
        }

        stage('Update Tracker API') {
    steps {
        script {
            echo "Notifying Deployment Tracker..."
            
            // 1. Create a Map of your data
            def payload = [
                project_id: params.PROJECT_ID,
                environment_id: params.ENVIRONMENT_ID,
                pipeline_id: env.BUILD_NUMBER,
                version: "1.0.${env.BUILD_NUMBER}",
                branch: params.DEPLOY_BRANCH,
                commit_message: env.COMMIT_MSG,
                commit_author: env.COMMIT_AUTHOR,
                commit_author_email: env.COMMIT_EMAIL,
                commit_hash: env.COMMIT_HASH,
                triggered_by: [
                    username: "Jenkins",
                    user_id: "system"
                ]
            ]

            // 2. Convert to JSON string using Groovy's native helper
            // Note: This requires the 'Pipeline Utility Steps' plugin (standard in most Jenkins)
            writeJSON file: 'payload.json', json: payload

            try {
                // 3. Use @filename to send the JSON safely
                sh "curl -s -X POST http://${params.EC2_HOST}:5000/api/jenkins-webhook \
                    -H 'Content-Type: application/json' \
                    -d @payload.json"
                
                echo "Tracker API updated successfully!"
            } catch (Exception e) {
                echo "Warning: Tracker API update failed. Error: ${e.message}"
            } finally {
                sh "rm -f payload.json" // Cleanup
            }
        }
    }
}
    }

    post {
        success {
            echo "-----------------------------------------------------------"
            echo "DEPLOYMENT COMPLETE"
            echo "URL: http://${env.PUBLIC_IP}"
            echo "-----------------------------------------------------------"
        }
        failure {
            echo "DEPLOYMENT FAILED: Check the build console for errors."
        }
    }
}
