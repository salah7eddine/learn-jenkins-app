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

        stage('AWS') {
            agent {
                docker {
                    image 'amazon/aws-cli:latest'
                    args '--entrypoint=""'
                    reuseNode true
                }
            }

            steps {
                sh '''
                    set -eux
                    aws --version
                '''
            }
        }

        stage('Build Playwright image') {
            steps {
                sh '''
                    set -eux

                    docker build --pull -t my-playwright .

                    docker run --rm my-playwright sh -c '
                        node --version
                        netlify --version
                        jq --version
                    '
                '''
            }
        }

        stage('Build application') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }

            steps {
                sh '''
                    set -eux

                    node --version
                    npm --version

                    npm ci
                    npm run build

                    test -f build/index.html
                    ls -la build
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
                            set -eux
                            npm test -- --watchAll=false
                        '''
                    }

                    post {
                        always {
                            junit allowEmptyResults: true,
                                  testResults: 'jest-results/junit.xml'
                        }
                    }
                }

                stage('Local E2E') {
                    agent {
                        docker {
                            image 'my-playwright'
                            reuseNode true
                        }
                    }

                    environment {
                        CI_ENVIRONMENT_URL = 'http://127.0.0.1:3000'
                        PLAYWRIGHT_HTML_OUTPUT_DIR = 'playwright-report-local'
                    }

                    steps {
                        sh '''
                            set -eux

                            test -f build/index.html

                            serve -s build -l 3000 > serve.log 2>&1 &
                            SERVER_PID=$!

                            trap 'kill $SERVER_PID || true' EXIT

                            sleep 10

                            curl --fail http://127.0.0.1:3000

                            npx playwright test --reporter=html
                        '''
                    }

                    post {
                        always {
                            publishHTML([
                                allowMissing: true,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'playwright-report-local',
                                reportFiles: 'index.html',
                                reportName: 'Local E2E'
                            ])
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
                PLAYWRIGHT_HTML_OUTPUT_DIR = 'playwright-report-staging'
            }

            steps {
                sh '''
                    set -eux

                    test -f build/index.html

                    netlify --version

                    echo "Deploying to staging"
                    echo "Netlify Site ID: $NETLIFY_SITE_ID"

                    netlify deploy \
                        --dir=build \
                        --no-build \
                        --json > deploy-output.json

                    cat deploy-output.json

                    export CI_ENVIRONMENT_URL="$(jq -r '.deploy_url' deploy-output.json)"

                    test -n "$CI_ENVIRONMENT_URL"
                    test "$CI_ENVIRONMENT_URL" != "null"

                    echo "Staging URL: $CI_ENVIRONMENT_URL"

                    npx playwright test --reporter=html
                '''
            }

            post {
                always {
                    archiveArtifacts artifacts: 'deploy-output.json',
                                     allowEmptyArchive: true

                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'playwright-report-staging',
                        reportFiles: 'index.html',
                        reportName: 'Staging E2E'
                    ])
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
                PLAYWRIGHT_HTML_OUTPUT_DIR = 'playwright-report-prod'
            }

            steps {
                sh '''
                    set -eux

                    test -f build/index.html

                    echo "Deploying to production"
                    echo "Netlify Site ID: $NETLIFY_SITE_ID"

                    netlify deploy \
                        --dir=build \
                        --no-build \
                        --prod \
                        --json > deploy-prod-output.json

                    cat deploy-prod-output.json

                    export CI_ENVIRONMENT_URL="$(jq -r '.url // .deploy_url' deploy-prod-output.json)"

                    test -n "$CI_ENVIRONMENT_URL"
                    test "$CI_ENVIRONMENT_URL" != "null"

                    echo "Production URL: $CI_ENVIRONMENT_URL"

                    npx playwright test --reporter=html
                '''
            }

            post {
                always {
                    archiveArtifacts artifacts: 'deploy-prod-output.json',
                                     allowEmptyArchive: true

                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'playwright-report-prod',
                        reportFiles: 'index.html',
                        reportName: 'Production E2E'
                    ])
                }
            }
        }
    }
}