pipeline {
    agent any

    environment {
        NETLIFY_SITE_ID    = '57eb8420-2bbc-4e06-bda1-ba3a8acde380'
        NETLIFY_AUTH_TOKEN = credentials('netlify-auth-token')
        REACT_APP_VERSION  = "1.0.${BUILD_ID}"
        NODE_OPTIONS       = '--max-old-space-size=4096'
        CI                 = 'true'
    }

    stages {

        stage('Deploy to AWS') {
            agent {
                docker {
                    image 'amazon/aws-cli'
                    reuseNode true
                    args "--entrypoint=''"
                }
            }
            environment {
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'my-aws', passwordVariable: 'AWS_SECRET_ACCESS_KEY', usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        aws --version
                        aws ecs register-task-definition --cli-input-json file://aws/task-definition-prod.json
                    '''
                }
            }
        }

        
        stage('Build') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    ls -la
                    node --version
                    npm --version
                    npm ci
                    npm run build
                    ls -la
                '''
            }
        }
    }
}
