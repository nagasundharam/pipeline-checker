pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: 'quotes-app-001', description: 'The ID of the project')
        string(name: 'ENVIRONMENT_ID', defaultValue: 'production-env-01', description: 'The target environment')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
    }

    environment {
        COMMIT_HASH = ""
        COMMIT_MSG = ""
        COMMIT_AUTHOR = ""
        PUBLIC_IP = ""
    }

    stages {
        stage('Checkout & Metadata') {
            steps {
                checkout scm
                script {
                    // Capture Git metadata
                    env.COMMIT_HASH = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    
                    // Capture Public IP
                    env.PUBLIC_IP = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()
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

        stage('Project Deployment Details') {
            steps {
                script {
                    echo """
                    ===========================================================
                    PROJECT DEPLOYMENT DETAILS (Pre-Tracker Setup)
                    ===========================================================
                    Project ID:    ${params.PROJECT_ID}
                    Environment:   ${params.ENVIRONMENT_ID}
                    Build Number:  ${env.BUILD_NUMBER}
                    Branch:        ${params.DEPLOY_BRANCH}
                    Commit Hash:   ${env.COMMIT_HASH}
                    Author:        ${env.COMMIT_AUTHOR}
                    Message:       ${env.COMMIT_MSG}
                    Deployment IP: ${env.PUBLIC_IP}
                    ===========================================================
                    """
                }
            }
        }

        stage('Deploy to Web Server') {
            steps {
                // Ensure /var/www/html is writable by jenkins user: 
                // sudo chown -R jenkins:jenkins /var/www/html
                sh 'cp -r dist/* /var/www/html/'
            }
        }
    }

    post {
        success {
            echo "-----------------------------------------------------------"
            echo "SUCCESS: Frontend is live at http://${env.PUBLIC_IP}"
            echo "-----------------------------------------------------------"
        }
        failure {
            echo "Build failed. Please check the console output above."
        }
    }
}