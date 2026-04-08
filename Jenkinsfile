pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  environment {
    BASE_URL = 'http://localhost'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'cp .env.example .env'
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm run build'
        }
      }
    }

    stage('Backend Check') {
      steps {
        dir('backend') {
          sh 'npm ci'
          sh 'node --check server.js'
          sh 'node --check src/app.js'
        }
      }
    }

    stage('Docker Compose Build') {
      steps {
        sh 'docker compose -f docker-compose.yml build'
      }
    }

    stage('Run Stack') {
      steps {
        sh 'cp .env.example .env'
        sh 'docker compose down -v || true'
        sh 'docker compose up --build -d'
      }
    }

    stage('Smoke Checks') {
      steps {
        sh 'chmod +x scripts/*.sh'
        sh './scripts/smoke-check.sh "$BASE_URL"'
        sh './scripts/auth-smoke-check.sh "$BASE_URL"'
      }
    }
  }

  post {
    always {
      sh 'docker compose logs --tail=100 || true'
      sh 'docker compose down -v || true'
      sh 'rm -f .env || true'
      archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
    }
  }
}
