pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('7529f016-46a0-49f5-a1e8-a3625714f32e')
        BACKEND_IMAGE = 'sidharthsingh7/sstest_backend'
        FRONTEND_IMAGE = 'sidharthsingh7/sstest_user_frontend'
        DOCKER_TAG = '0.0.2.TEST'
    }

    stages {
        stage('Build') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        script {
                            
                            // Build the backend Docker image
                            sh 'docker build -t $BACKEND_IMAGE:$DOCKER_TAG ./backend'
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        script {
                            
                            // Build the frontend Docker image
                            sh 'docker build -t $FRONTEND_IMAGE:$DOCKER_TAG ./user_frontend'
                        }
                    }
                }
            }
        }

        stage('Push') {
            parallel {
                stage('Push Backend Image') {
                    steps {
                        script {
                            docker.withRegistry('https://index.docker.io/v1/', '7529f016-46a0-49f5-a1e8-a3625714f32e') {
                                def backendImage = docker.image("$BACKEND_IMAGE:$DOCKER_TAG")
                                backendImage.push()
                            }
                        }
                    }
                }
                stage('Push Frontend Image') {
                    steps {
                        script {
                            docker.withRegistry('https://index.docker.io/v1/', '7529f016-46a0-49f5-a1e8-a3625714f32e') {
                                def frontendImage = docker.image("$FRONTEND_IMAGE:$DOCKER_TAG")
                                frontendImage.push()
                            }
                        }
                    }
                }
            }
        }
    }
}
