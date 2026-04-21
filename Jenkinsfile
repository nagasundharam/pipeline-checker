import groovy.json.JsonOutput

pipeline {
    agent any
    parameters {
        string(name: 'PROJECT_ID', defaultValue: '69ce6897557b3606c5b165ec')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69ce68b3557b3606c5b165fb')
        string(name: 'EC2_HOST', defaultValue: '34.204.195.105')
    }

    environment {
        VITE_API_URL = "http://${params.EC2_HOST}:5000/api"
        // Note: Do NOT define DEPLOYMENT_ID here to allow dynamic assignment
    }

    stages {
        stage('Initialize Tracker') {
            steps {
                script {
                    checkout scm
                    echo "Initializing Deployment Tracking..."
                    
                    def publicIp = sh(script: "curl -s --max-time 5 http://checkip.amazonaws.com || echo 'unknown'", returnStdout: true).trim()
                    def commitMsg = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    def commitAuthor = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    def commitHash = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    
                    def payload = [
                        project_id: params.PROJECT_ID,
                        environment_id: params.ENVIRONMENT_ID,
                        pipeline_id: env.BUILD_NUMBER,
                        version: "1.0.${env.BUILD_NUMBER}",
                        branch: "main",
                        commit_message: commitMsg,
                        commit_author: commitAuthor,
                        commit_hash: commitHash,
                        public_url: "http://${publicIp}",
                        triggered_by: [
                            username: commitAuthor,
                            source: "jenkins"
                        ],
                        stages: [
                            [name: "Initialize Tracker", status: "pending"],
                            [name: "Install & Build", status: "pending"],
                            [name: "Deploy Frontend", status: "pending"]
                        ]
                    ]

                    writeFile file: 'initial_payload.json', text: JsonOutput.toJson(payload)
                    
                    try {
                        def response = sh(script: "curl -s -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true).trim()
                        echo "API Response: ${response}"
                        
                        // Use readJSON for robust extraction (Requires 'Pipeline Utility Steps' plugin)
                        writeFile file: 'response.json', text: response
                        def json = readJSON file: 'response.json'
                        
                        if (json.deployment && json.deployment._id) {
                            env.DEPLOYMENT_ID = json.deployment._id.toString()
                            echo "Captured ID: ${env.DEPLOYMENT_ID}"
                            notifyStage("Initialize Tracker", "success")
                        } else {
                            error "Failed to initialize tracker: ${response}"
                        }
                    } catch (Exception e) {
                        echo "Tracking Error: ${e.message}"
                        // Build proceeds but tracking may be incomplete
                    }
                }
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    notifyStage("Install & Build", "running")
                    echo "Executing build tasks..."
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
                    echo "Deploying to production server..."
                    // Add your deployment commands here
                    notifyStage("Deploy Frontend", "success")
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.DEPLOYMENT_ID) {
                    echo "Finalizing successful deployment..."
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"success\"}'"
                }
            }
        }
        failure {
            script {
                if (env.DEPLOYMENT_ID) {
                    echo "Reporting deployment failure..."
                    // Check which stage failed and update the tracker
                    notifyStage("Deploy Frontend", "failed") 
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"failed\"}'"
                }
            }
        }
    }
}

def notifyStage(String name, String status) {
    if (env.DEPLOYMENT_ID && env.DEPLOYMENT_ID != "") {
        try {
            def stagePayload = [stageName: name, status: status]
            writeFile file: "stage_data.json", text: JsonOutput.toJson(stagePayload)
            sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d @stage_data.json"
        } catch (Exception e) {
            echo "Stage notify failed: ${e.message}"
        }
    }
}
