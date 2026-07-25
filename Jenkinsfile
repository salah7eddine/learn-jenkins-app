pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        skipDefaultCheckout(false)
    }

    environment {
        NODE_IMAGE       = 'node:18-alpine'
        PLAYWRIGHT_IMAGE = 'mcr.microsoft.com/playwright:v1.39.0-jammy'

        BUILD_DIRECTORY  = 'build'
        BUILD_FILE_NAME  = 'index.html'

        APP_PORT          = '3000'
        APP_URL           = 'http://127.0.0.1:3000'

        CI                = 'true'
    }

    stages {
        stage('Install and Build') {
            agent {
                docker {
                    image "${NODE_IMAGE}"
                    reuseNode true
                }
            }

            steps {
                sh '''
                    set -eu

                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    npm ci
                    npm run build

                    test -d "${BUILD_DIRECTORY}"
                    test -f "${BUILD_DIRECTORY}/${BUILD_FILE_NAME}"

                    echo "Build generated successfully."
                '''
            }
        }

        stage('Tests') {
            parallel {
                stage('Unit Tests') {
                    agent {
                        docker {
                            image "${NODE_IMAGE}"
                            reuseNode true
                        }
                    }

                    steps {
                        sh '''
                            set -eu

                            test -f "${BUILD_DIRECTORY}/${BUILD_FILE_NAME}"

                            npm test -- --ci --runInBand

                            grep -q \
                                "Learn Jenkins" \
                                "${BUILD_DIRECTORY}/${BUILD_FILE_NAME}"

                            echo "Unit tests and build validation succeeded."
                        '''
                    }

                    post {
                        always {
                            junit(
                                testResults: 'jest-results/junit.xml',
                                allowEmptyResults: true,
                                keepLongStdio: true
                            )
                        }
                    }
                }

                stage('E2E Tests') {
                    agent {
                        docker {
                            image "${PLAYWRIGHT_IMAGE}"
                            reuseNode true
                            args '--init --ipc=host'
                        }
                    }

                    steps {
                        sh '''
                            set -eu

                            mkdir -p \
                                playwright-report \
                                test-results

                            echo "Starting application server..."

                            ./node_modules/.bin/serve \
                                -s "${BUILD_DIRECTORY}" \
                                -l "${APP_PORT}" \
                                > serve.log 2>&1 &

                            SERVER_PID=$!

                            cleanup() {
                                echo "Stopping application server..."

                                if kill -0 "${SERVER_PID}" 2>/dev/null; then
                                    kill "${SERVER_PID}" || true
                                    wait "${SERVER_PID}" 2>/dev/null || true
                                fi
                            }

                            trap cleanup EXIT INT TERM

                            echo "Waiting for application at ${APP_URL}..."

                            READY=false

                            for attempt in $(seq 1 30); do
                                if node -e "
                                    fetch('${APP_URL}')
                                        .then(response => {
                                            if (!response.ok) {
                                                process.exit(1);
                                            }
                                        })
                                        .catch(() => process.exit(1));
                                "
                                then
                                    READY=true
                                    break
                                fi

                                sleep 1
                            done

                            if [ "${READY}" != "true" ]; then
                                echo "Application failed to start."
                                cat serve.log || true
                                exit 1
                            fi

                            echo "Application is ready."

                            npx playwright test \
                                --reporter=html,junit
                        '''
                    }

                    post {
                        always {
                            publishHTML([
                                allowMissing: true,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'playwright-report',
                                reportFiles: 'index.html',
                                reportName: 'Playwright HTML Report',
                                reportTitles: 'E2E Test Results'
                            ])

                            junit(
                                testResults: 'test-results/**/*.xml',
                                allowEmptyResults: true,
                                keepLongStdio: true
                            )

                            archiveArtifacts(
                                artifacts: '''
                                    playwright-report/**/*,
                                    test-results/**/*,
                                    serve.log
                                ''',
                                allowEmptyArchive: true
                            )
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
        }

        unstable {
            echo 'Pipeline completed with unstable test results.'
        }

        failure {
            echo 'Pipeline failed. Check the Jenkins logs and reports.'
        }

        cleanup {
            deleteDir()
        }
    }
}