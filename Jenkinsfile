import groovy.json.JsonOutput

pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: '69d0996c860c3a42c3d8de5b', description: 'The unique ID of the project')
        string(name: 'ENVIRONMENT_ID', defaultValue: '69d099d1860c3a42c3d8de6d', description: 'The target environment ID')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
        string(name: 'VITE_API_URL', defaultValue: 'http://34.204.195.105:5000/api', description: 'Backend API URL')
    }

    environment {
        MONGO_URI     = credentials('MONGO_URI')
        JWT_SECRET    = credentials('JWT_SECRET')
        DATABASE_PORT = credentials('DATABASE_PORT')
        API_URL       = "${params.VITE_API_URL}"
    }

    stages {
        stage('Initialize Tracker') {
            steps {
                script {
                    echo "Extracting Git Metadata..."
                    checkout scm
                    def localCommitHash = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    def localCommitMsg = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    def localCommitAuthor = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    def localCommitEmail = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    
                    def publicIpResponse = sh(script: "curl -s --max-time 5 http://checkip.amazonaws.com || echo 'unknown'", returnStdout: true)
                    def publicIp = publicIpResponse ? publicIpResponse.trim() : "unknown"

                    def payload = [
                        project_id: params.PROJECT_ID,
                        environment_id: params.ENVIRONMENT_ID,
                        pipeline_id: env.BUILD_NUMBER,
                        version: "1.0.${env.BUILD_NUMBER}",
                        branch: params.DEPLOY_BRANCH,
                        commit_message: localCommitMsg,
                        commit_author: localCommitAuthor,
                        commit_author_email: localCommitEmail,
                        commit_hash: localCommitHash,
                        public_url: "http://${publicIp}",
                        node_name: env.NODE_NAME ?: "master",
                        triggered_by: [username: localCommitAuthor, source: "jenkins"],
                        stages: [
                            [name: "Initialize Tracker", status: "pending"],
                            [name: "Install & Build", status: "pending"],
                            [name: "Deploy Services", status: "pending"]
                        ]
                    ]

                    writeFile file: 'initial_payload.json', text: JsonOutput.toJson(payload)
                    
                    try {
                        def response = sh(script: "curl -s -X POST ${env.API_URL}/jenkins-webhook -H 'Content-Type: application/json' -d @initial_payload.json", returnStdout: true).trim()
                        echo "API Response: ${response}"
                        writeFile file: 'response.json', text: response
                        
                        def json = readJSON file: 'response.json'
                        def extractedId = (json.deployment && json.deployment['_id']) ? json.deployment['_id'] : null
                        
                        if (extractedId) {
                            env.DEPLOYMENT_ID = extractedId.toString()
                            notifyStage("Initialize Tracker", "success")
                        }
                    } catch (Exception e) {
                        echo "Initialization failed: ${e.message}"
                    }
                }
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    notifyStage("Install & Build", "running")
                    echo "Building Application..."
                    
                    // Re-adding the build commands into your working logic
                    sh 'npm install --no-audit --no-fund --prefer-offline'
                    sh 'npm run build'
                    
                    notifyStage("Install & Build", "success")
                }
            }
        }

        stage('Deploy Services') {
            steps {
                script {
                    notifyStage("Deploy Services", "running")
                    echo "Starting Docker containers..."
                    
                    sh """
                        export MONGO_URI='${env.MONGO_URI}'
                        export JWT_SECRET='${env.JWT_SECRET}'
                        export PORT='${env.DATABASE_PORT}'
                        export VITE_API_URL='${env.API_URL}'
                        docker compose up -d --build --force-recreate
                    """
                    
                    notifyStage("Deploy Services", "success")
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.DEPLOYMENT_ID) {
                    sh "curl -s -X PATCH ${env.API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"success\"}'"
                }
            }
        }
        failure {
            script {
                if (env.DEPLOYMENT_ID) {
                    // Update the last active stage to failed
                    sh "curl -s -X PATCH ${env.API_URL}/deployments/${env.DEPLOYMENT_ID}/status -H 'Content-Type: application/json' -d '{\"status\": \"failed\"}'"
                }
            }
        }
    }
}

// Your working notify function
def notifyStage(String name, String status) {
    if (env.DEPLOYMENT_ID && env.DEPLOYMENT_ID != "") {
        try {
            echo "NOTIFY: ${name} -> ${status}"
            def payload = [stageName: name, status: status]
            writeFile file: "stage_data.json", text: JsonOutput.toJson(payload)
            sh "curl -s -X PATCH ${env.API_URL}/deployments/${env.DEPLOYMENT_ID}/stage -H 'Content-Type: application/json' -d @stage_data.json"
        } catch (Exception e) {
            echo "Notify failed: ${e.message}"
        }
    }
}