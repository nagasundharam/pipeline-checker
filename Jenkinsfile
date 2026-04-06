import groovy.json.JsonOutput

pipeline {
    agent any
    parameters {
        string(name: 'PROJECT_ID', defaultValue: '69ce6897557b3606c5b165ec')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69ce68b3557b3606c5b165fb')
        string(name: 'EC2_HOST', defaultValue: '34.204.195.105')
        // Ensure you have a 'ssh-user' credential stored in Jenkins
        string(name: 'SSH_USER', defaultValue: 'ubuntu') 
    }

    environment {
        VITE_API_URL = "http://${params.EC2_HOST}:5000/api"
        DEPLOYMENT_ID = ""
        CURRENT_STAGE = ""
    }

    stages {
        stage('Initialize & Clean') {
            steps {
                script {
                    env.CURRENT_STAGE = "Initialize"
                    // Force a clean workspace to ensure no old code persists
                    deleteDir()
                    checkout scm
                    
                    def publicIp = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()
                    
                    def payload = [
                        project_id: params.PROJECT_ID,
                        environment_id: params.ENVIRONMENT_ID,
                        pipeline_id: env.BUILD_NUMBER,
                        version: "1.0.${env.BUILD_NUMBER}",
                        branch: "main",
                        commit_message: sh(script: "git log -1 --pretty=%B", returnStdout: true).trim(),
                        commit_author: sh(script: "git log -1 --pretty=%an", returnStdout: true).trim(),
                        public_url: "http://${publicIp}",
                        triggered_by: [
                            username: sh(script: "git log -1 --pretty=%an", returnStdout: true).trim(),
                            source: "jenkins"
                        ],
                        stages: [
                            [name: "Initialize", status: "pending"],
                            [name: "Install & Build", status: "pending"],
                            [name: "Deploy Frontend", status: "pending"]
                        ]
                    ]

                    def response = sh(script: "curl -s -X POST ${env.VITE_API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d '${JsonOutput.toJson(payload)}'", returnStdout: true).trim()
                    env.DEPLOYMENT_ID = sh(script: "echo '${response}' | grep -oP '\"_id\":\"\\K[^\"]+' | head -1", returnStdout: true).trim()
                    
                    notifyStage(env.CURRENT_STAGE, "success")
                }
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    env.CURRENT_STAGE = "Install & Build"
                    notifyStage(env.CURRENT_STAGE, "running")
                    
                    // 1. Install dependencies
                    sh 'npm install'
                    // 2. IMPORTANT: Generate the fresh 'dist' or 'build' folder
                    sh 'npm run build' 
                    
                    notifyStage(env.CURRENT_STAGE, "success")
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                script {
                    env.CURRENT_STAGE = "Deploy Frontend"
                    notifyStage(env.CURRENT_STAGE, "running")

                    // This step moves the 'dist' folder to your EC2 server.
                    // Replace '/var/www/html' with your actual web server path.
                    sshagent(['ec2-ssh-key']) { // 'ec2-ssh-key' is the ID of your Jenkins SSH Credential
                        sh "rsync -avz -e 'ssh -o StrictHostKeyChecking=no' dist/ ${params.SSH_USER}@${params.EC2_HOST}:/var/www/html/"
                    }
                    
                    notifyStage(env.CURRENT_STAGE, "success")
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
                    notifyStage(env.CURRENT_STAGE, "failed")
                    sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"failed\"}'"
                }
            }
        }
    }
}

def notifyStage(String name, String status) {
    if (env.DEPLOYMENT_ID) {
        def stagePayload = [stageName: name, status: status]
        sh "curl -s -X PATCH ${env.VITE_API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d '${JsonOutput.toJson(stagePayload)}'"
    }
}