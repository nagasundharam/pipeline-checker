pipeline {
    agent any

    parameters {
        string(name: 'PROJECT_ID', defaultValue: 'quotes-app-001', description: 'The ID of the project')
        string(name: 'ENVIRONMENT_ID', defaultValue: 'production-env-01', description: 'The target environment')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'The branch being deployed')
        string(name: 'EC2_HOST', defaultValue: 'localhost', description: 'The host of the tracker backend')
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
                    env.COMMIT_HASH = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
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
                // Moving files to Nginx folder so the app is live
                sh 'cp -r dist/* /var/www/html/'
                echo "App is now live at http://${env.PUBLIC_IP}"
            }
        }

        stage('Update Tracker API') {
            steps {
                script {
                    // This runs AFTER the app is already live
                    try {
                        sh """
                            curl -s -X POST http://${params.EC2_HOST}:5000/api/jenkins-webhook \\
                            -H "Content-Type: application/json" \\
                            -d '{
                                "project_id": "${params.PROJECT_ID}",
                                "environment_id": "${params.ENVIRONMENT_ID}",
                                "pipeline_id": "${env.BUILD_NUMBER}",
                                "version": "${env.COMMIT_HASH}",
                                "branch": "${params.DEPLOY_BRANCH}",
                                "commit_message": "${env.COMMIT_MSG}",
                                "commit_author": "${env.COMMIT_AUTHOR}"
                            }'
                        """
                    } catch (Exception e) {
                        echo "Tracker API call failed, but frontend is already deployed!"
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
    }
}
