import groovy.json.JsonOutput

pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: '69ce6897557b3606c5b165ec', description: 'The unique ID of the project in the tracker')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69ce68b3557b3606c5b165fb', description: 'The target environment ID')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
        string(name: 'EC2_HOST', defaultValue: '34.204.195.105', description: 'The IP/Host of your Deployment Tracker backend')
    }

    environment {
        // Robust fallback for the API host
        DEFAULT_API_HOST = '34.204.195.105'
        TRACKER_PORT = '5000'
        
        COMMIT_HASH = ""
        COMMIT_MSG = ""
        COMMIT_AUTHOR = ""
        COMMIT_EMAIL = ""
        PUBLIC_IP = ""
        VITE_API_URL = "" // Initialized securely in script
    }

    stages {
        stage('Initialize Tracker') {
            steps {
                script {
                    echo "Configuring Tracker API Endpoint..."
                    // Safely evaluate apiHost to avoid empty host error
                    def apiHost = (params.EC2_HOST && params.EC2_HOST != "") ? params.EC2_HOST : env.DEFAULT_API_HOST
                    env.VITE_API_URL = "http://${apiHost}:${env.TRACKER_PORT}/api"
                    echo "Final Tracker URL: ${env.VITE_API_URL}"

                    echo "Extracting Git Metadata..."
                    checkout scm
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_EMAIL = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    env.PUBLIC_IP = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()

                    echo "Initializing Deployment Record in Tracker..."
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
                        public_url: "http://${env.PUBLIC_IP}",
                        node_name: env.NODE_NAME ?: "master",
                        artifacts: [[name: "Static Assets", url: "frontend-dist-${env.BUILD_NUMBER}"]],
                        triggered_by: [
                            username: env.COMMIT_AUTHOR,
                            source: "jenkins"
                        ]
                    ]

                    def jsonString = JsonOutput.toJson(payload)
                    writeFile file: 'initial_payload.json', text: jsonString
                    
                    def response = sh(script: "curl -s -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true)
                    
                    // Use grep as a robust fallback for parsing the ID from the JSON response
                    env.DEPLOYMENT_ID = sh(script: "echo '${response}' | grep -oP '\"_id\":\"\\K[^\"]+' | head -1", returnStdout: true).trim()
                    
                    if (!env.DEPLOYMENT_ID || env.DEPLOYMENT_ID == "") {
                        echo "WARNING: Failed to capture DEPLOYMENT_ID. Pipeline will continue without live tracking."
                    } else {
                        echo "Tracker Initialized. Deployment ID: ${env.DEPLOYMENT_ID}"
                    }
                }
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    notifyStage("Install & Build", "running")
                    sh 'npm install'
                    sh 'npm run build'
                    notifyStage("Install & Build", "success")
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                script {
                    notifyStage("Deploy Frontend", "running")
                    // Updated to ensure directory exists before copy
                    sh "mkdir -p /tmp/dist && cp -r dist/* /tmp/dist/"
                    echo "Deployment finished. App is live at http://${env.PUBLIC_IP}"
                    notifyStage("Deploy Frontend", "success")
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.DEPLOYMENT_ID && env.DEPLOYMENT_ID != "") {
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"success\"}'"
                }
            }
            echo "-----------------------------------------------------------"
            echo "DEPLOYMENT COMPLETE"
            echo "URL: http://${env.PUBLIC_IP}"
            echo "-----------------------------------------------------------"
        }
        failure {
            script {
                if (env.DEPLOYMENT_ID && env.DEPLOYMENT_ID != "") {
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"failed\"}'"
                }
            }
            echo "DEPLOYMENT FAILED: Check terminal output."
        }
    }
}

// Helper function defined OUTSIDE the pipeline block
def notifyStage(String name, String status) {
    if (env.DEPLOYMENT_ID && env.DEPLOYMENT_ID != "") {
        echo "Notifying Tracker: ${name} -> ${status}"
        def stagePayload = [
            stageName: name,
            status: status
        ]
        def jsonString = JsonOutput.toJson(stagePayload)
        writeFile file: "stage_data.json", text: jsonString
        sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d @stage_data.json"
    } else {
        echo "Skipping notification for ${name} - No DEPLOYMENT_ID available."
    }
}
