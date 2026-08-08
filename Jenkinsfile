pipeline {
    agent any

    environment {
        REACT_APP_VERSION  = "1.0.${BUILD_ID}"
        NODE_OPTIONS       = '--max-old-space-size=4096'
        CI                 = 'true'
        AWS_DEFAULT_REGION = 'us-east-1'
        AWS_ECS_CLUSTER     = 'LeanJenkinsApp-Cluster-Prod'
        AWS_ECS_SERVICE     = 'LearnJenkinsApp-TaskDefinition-Prod-service-ka9jpd3v'
        AWS_ECS_TASK_DEFINITION = 'LearnJenkinsApp-TaskDefinition-Prod'
    }

    stages {

        stage('Deploy to AWS') {
            agent {
                docker {
                    image 'amazon/aws-cli'
                    reuseNode true
                    args "-u root --entrypoint=''"
                }
            }

            steps {
                withCredentials([usernamePassword(credentialsId: 'my-aws', passwordVariable: 'AWS_SECRET_ACCESS_KEY', usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        aws --version
                        yum install jq -y
                        LATEST_TD_REVISION=$(aws ecs register-task-definition --cli-input-json file://aws/task-definition-prod.json | jq '.taskDefinition.revision')
                        echo $LATEST_TD_REVISION
                        aws ecs update-service --cluster $AWS_ECS_CLUSTER --service $AWS_ECS_SERVICE  --task-definition $AWS_ECS_TASK_DEFINITION:$LATEST_TD_REVISION
                        aws ecs wait services-stable --cluster $AWS_ECS_CLUSTER --services $AWS_ECS_SERVICE
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
