pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: 'quotes-app-001', description: 'The ID of the project in the tracker')
        string(name: 'ENVIRONMENT_ID', defaultValue: 'production-env-01', description: 'The target environment ID')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
        string(name: 'EC2_HOST', defaultValue: 'localhost', description: 'The host of the tracker backend')
    }

    environment {
        COMMIT_MSG = ""
        COMMIT_AUTHOR = ""
        COMMIT_AUTHOR_EMAIL = ""
        COMMIT_HASH = ""
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Extract Git details for the tracker
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_AUTHOR_EMAIL = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Update DeployFlow Tracker') {
            steps {
                script {
                    // Hit the custom webhook in your own backend to record this deployment
                    def response = sh(script: """
                        curl -s -X POST http://${params.EC2_HOST}:5000/api/jenkins-webhook \\
                        -H "Content-Type: application/json" \\
                        -d '{
                            "project_id": "${params.PROJECT_ID}",
                            "environment_id": "${params.ENVIRONMENT_ID}",
                            "pipeline_id": "${env.BUILD_NUMBER}",
                            "version": "${env.COMMIT_HASH}",
                            "branch": "${params.DEPLOY_BRANCH}",
                            "commit_message": "${env.COMMIT_MSG}",
                            "commit_author": "${env.COMMIT_AUTHOR}",
                            "commit_author_email": "${env.COMMIT_AUTHOR_EMAIL}",
                            "commit_hash": "${env.COMMIT_HASH}",
                            "triggered_by": {
                                "username": "Jenkins AWS Deployer",
                                "user_id": "system"
                            }
                        }'
                    """, returnStdout: true).trim()
                    echo "Tracker Response: ${response}"
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successfully tracked and completed.'
        }
        failure {
            echo 'Deployment or tracking failed. Please check the logs.'
        }
    }
}
