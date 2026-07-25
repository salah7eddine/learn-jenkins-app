pipeline {
    agent any

    environment {
        BUILD_FILE_NAME = 'index.html'
    }

    stages {
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
                    node -v
                    npm -v
                    npm ci
                    npm run build
                    ls -la 
                '''                
            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    npm test
                    test -f build/$BUILD_FILE_NAME
                    echo "Build file exists"
                    grep "Learn Jenkins" build/$BUILD_FILE_NAME
                    echo "Build file contains expected content"
                '''
            }
        }
    }
}
