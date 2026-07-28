pipeline {
    agent any

    environment {
        NETLIFY_SITE_ID = '57eb8420-2bbc-4e06-bda1-ba3a8acde380'
        NETLIFY_AUTH_TOKEN = credentials('netlify-auth-token')
        REACT_APP_VERSION = "1.0.${BUILD_ID}"
        NODE_OPTIONS = '--max-old-space-size=4096'
    }

    stages {
        stage('Docker') {
            steps {
                sh 'docker build -t my-playwright .'
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

        stage('Tests') {
            parallel {
                stage('Unit tests') {
                    agent {
                        docker {
                            image 'node:18-alpine'
                            reuseNode true
                        }
                    }

                    steps {
                        sh '''
                            set -e
                            rm -rf node_modules package-lock.json
                            npm install
                            CI=true npm test -- --watch=false
                        '''
                    }
                    post {
                        always {
                            junit 'jest-results/junit.xml'
                        }
                    }
                }

                stage('E2E') {
                    agent {
                        docker {
                            image 'mcr.microsoft.com/playwright:v1.39.0-jammy'
                            reuseNode true
                        }
                    }

                    steps {
                        sh '''
                            set -e
                            export REACT_APP_VERSION="$REACT_APP_VERSION"
                            npm ci
                            REACT_APP_VERSION="$REACT_APP_VERSION" npm run build
                            npm install serve

                            echo "Starting static server for Playwright"
                            node_modules/.bin/serve -s build -l 3000 > /tmp/serve.log 2>&1 &
                            SERVER_PID=$!

                            for i in $(seq 1 30); do
                                if curl -sf http://localhost:3000/ >/dev/null 2>&1; then
                                    echo "Server is ready"
                                    break
                                fi
                                sleep 1
                            done

                            if ! curl -sf http://localhost:3000/ >/dev/null 2>&1; then
                                echo "Server did not become ready"
                                cat /tmp/serve.log || true
                                exit 1
                            fi

                            npx playwright test --reporter=html
                            kill $SERVER_PID || true
                        '''
                    }

                    post {
                        always {
                            publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: false, reportDir: 'playwright-report', reportFiles: 'index.html', reportName: 'Local E2E', reportTitles: '', useWrapperFileDirectly: true])
                        }
                    }
                }
            }
        }

        stage('Deploy staging') {
            agent {
                docker {
                    image 'my-playwright'
                    reuseNode true
                }
            }

            environment {
                CI_ENVIRONMENT_URL = 'STAGING_URL_TO_BE_SET'
            }

            steps {
                sh '''
                    export REACT_APP_VERSION="$REACT_APP_VERSION"
                    netlify --version
                    echo "Deploying to staging. Site ID: $NETLIFY_SITE_ID"
                    netlify status
                    netlify deploy --dir=build --no-build --json > deploy-output.json
                    CI_ENVIRONMENT_URL=$(node-jq -r '.deploy_url' deploy-output.json)
                    npx playwright test  --reporter=html
                '''
            }

            post {
                always {
                    publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: false, reportDir: 'playwright-report', reportFiles: 'index.html', reportName: 'Staging E2E', reportTitles: '', useWrapperFileDirectly: true])
                }
            }
        }

        stage('Deploy prod') {
            agent {
                docker {
                    image 'my-playwright'
                    reuseNode true
                }
            }

            environment {
                CI_ENVIRONMENT_URL = 'https://6a65be3a6e10d176ec1bb89f--jolly-cocada-e69d06.netlify.app'
            }

            steps {
                sh '''
                    export REACT_APP_VERSION="$REACT_APP_VERSION"
                    node --version
                    netlify --version
                    echo "Deploying to production. Site ID: $NETLIFY_SITE_ID"
                    netlify status
                    netlify deploy --dir=build --no-build --prod
                    npx playwright test  --reporter=html
                '''
            }

            post {
                always {
                    publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: false, reportDir: 'playwright-report', reportFiles: 'index.html', reportName: 'Prod E2E', reportTitles: '', useWrapperFileDirectly: true])
                }
            }
        }
    }
}
