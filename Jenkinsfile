pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: 'quotes-app-001', description: 'The ID of the project in the tracker')
        string(name: 'ENVIRONMENT_ID', defaultValue: 'production-env-01', description: 'The target environment ID')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
        // Updated to use the actual IP if you aren't running the tracker on Jenkins' localhost
        string(name: 'TRACKER_HOST', defaultValue: '44.211.24.70', description: 'The public IP of the tracker backend')
    }

    environment {
        COMMIT_MSG = ""
        COMMIT_AUTHOR = ""
        COMMIT_AUTHOR_EMAIL = ""
        COMMIT_HASH = ""
        PUBLIC_IP = ""
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Get Git Info
                    env.COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_AUTHOR_EMAIL = sh(script: "git log -1 --pretty=%ae", returnStdout: true).trim()
                    
                    // Fetch Public IP of this EC2
                    env.PUBLIC_IP = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                // Uses the Node 22 you installed manually
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
                    // Hit the tracker using the public IP instead of localhost
                    sh """
                        curl -s -X POST http://${params.TRACKER_HOST}:5000/api/jenkins-webhook \\
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
                    """
                }
            }
        }
        
        stage('Deploy to Web Server') {
            steps {
                script {
                    // This moves your build files to the folder Nginx/Apache uses
                    // Note: Ensure /var/www/html is writable by 'jenkins' user or use sudo
                    sh 'sudo cp -r dist/* /var/www/html/'
                 echo "View App at: http://${env.PUBLIC_IP}"
                }
            }
        }
    }

    post {
        success {
            echo "-----------------------------------------------------------"
            echo "Frontend Deployed Successfully!"
            echo "View App at: http://${env.PUBLIC_IP}"
            echo "-----------------------------------------------------------"
        }
        failure {
            echo "Deployment failed. Check if tracker is running at http://${params.TRACKER_HOST}:5000"
        }
    }
}