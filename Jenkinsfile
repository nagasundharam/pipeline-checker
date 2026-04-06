import groovy.json.JsonOutput

pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: '69ce6897557b3606c5b165ec', description: 'Project ID')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69ce68b3557b3606c5b165fb', description: 'Environment ID')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Branch')
        string(name: 'EC2_HOST', defaultValue: '34.204.195.105', description: 'Backend Host')
    }

    environment {
        COMMIT_HASH = ""
        PUBLIC_IP = ""
        VITE_API_URL = "http://${params.EC2_HOST}:5000/api"
        DEPLOYMENT_ID = ""
    }

    stages {
        stage('Initialize Tracker') {
            steps {
                script {
                    echo "Extracting Git Metadata..."
                    checkout scm
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    def msg = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    def author = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    def email = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    env.PUBLIC_IP = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()

                    // PRE-DEFINE STAGES: This ensures the UI shows the "Not Started" states immediately
                    def payload = [
                        project_id: params.PROJECT_ID,
                        environment_id: params.ENVIRONMENT_ID,
                        pipeline_id: env.BUILD_NUMBER,
                        version: "1.0.${env.BUILD_NUMBER}",
                        branch: params.DEPLOY_BRANCH,
                        commit_message: msg,
                        commit_author: author,
                        commit_author_email: email,
                        commit_hash: env.COMMIT_HASH,
                        public_url: "http://${env.PUBLIC_IP}",
                        node_name: env.NODE_NAME ?: "master",
                        triggered_by: [username: author, source: "jenkins"],
                        stages: [
                            [name: "Initialize Tracker", status: "pending"],
                            [name: "Install & Build", status: "pending"],
                            [name: "Deploy Frontend", status: "pending"]
                        ]
                    ]

                    writeFile file: 'initial_payload.json', text: JsonOutput.toJson(payload)
                    
                    try {
                        def response = sh(script: "curl -s -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true).trim()
                        
                        // Capturing the ID using a more robust regex
                        env.DEPLOYMENT_ID = sh(script: "echo '${response}' | grep -oP '\"_id\":\"\\K[^\"]+' | head -1", returnStdout: true).trim()
                        
                        if (env.DEPLOYMENT_ID) {
                            echo "Tracker Initialized. ID: ${env.DEPLOYMENT_ID}"
                            notifyStage("Initialize Tracker", "success")
                        }
                    } catch (Exception e) {
                        echo "WARNING: Backend failed to initialize record: ${e.message}"
                    }
                }
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    notifyStage("Install & Build", "running")
                    
                    // TESTING FAILURE: This will make the "Install & Build" stage turn RED on your dashboard
                    sh 'npm install'
                    sh 'exit 1' 
                    
                    notifyStage("Install & Build", "success")
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                script {
                    notifyStage("Deploy Frontend", "running")
                    sh "mkdir -p /tmp/dist && touch /tmp/dist/index.html"
                    notifyStage("Deploy Frontend", "success")
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.DEPLOYMENT_ID) {
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"success\"}'"
                }
            }
        }
        failure {
            script {
                if (env.DEPLOYMENT_ID) {
                    // 1. Mark the specific failed stage as 'failed' so the details page updates
                    notifyStage("Install & Build", "failed")
                    
                    // 2. Mark the overall deployment as 'failed' for the main dashboard
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"failed\"}'"
                }
            }
        }
    }
}

def notifyStage(String name, String status) {
    if (env.DEPLOYMENT_ID) {
        try {
            def stagePayload = [stageName: name, status: status]
            writeFile file: "stage_data.json", text: JsonOutput.toJson(stagePayload)
            // This PATCH updates the specific stage inside the 'stages' array in MongoDB
            sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d @stage_data.json"
        } catch (Exception e) {
            echo "Failed to notify stage ${name}: ${e.message}"
        }
    }
}