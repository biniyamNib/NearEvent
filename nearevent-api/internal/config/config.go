package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppName           string
	AppEnv            string
	AppPort           string
	DBHost            string
	DBPort            string
	DBUser            string
	DBPass            string
	DBName            string
	DBSSL             string
	JWTSecret         string
	JWTExpiresInHours int
	AdminEmail        string
	AdminPassword     string
	AdminName         string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	expiresHours, err := strconv.Atoi(getEnv("JWT_EXPIRES_IN_HOURS", "72"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRES_IN_HOURS: %w", err)
	}

	cfg := &Config{
		AppName:           getEnv("APP_NAME", "NearEvent API"),
		AppEnv:            getEnv("APP_ENV", "development"),
		AppPort:           getEnv("APP_PORT", "8080"),
		DBHost:            getEnv("DB_HOST", "localhost"),
		DBPort:            getEnv("DB_PORT", "5432"),
		DBUser:            getEnv("DB_USER", "postgres"),
		DBPass:            getEnv("DB_PASSWORD", "postgres"),
		DBName:            getEnv("DB_NAME", "NearEvent"),
		DBSSL:             getEnv("DB_SSLMODE", "disable"),
		JWTSecret:         getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTExpiresInHours: expiresHours,
		AdminEmail:        getEnv("ADMIN_EMAIL", "admin@nearevent.com"),
		AdminPassword:     getEnv("ADMIN_PASSWORD", "Admin123!"),
		AdminName:         getEnv("ADMIN_NAME", "Admin User"),
	}

	return cfg, nil
}

func (c *Config) DatabaseURL() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.DBUser,
		c.DBPass,
		c.DBHost,
		c.DBPort,
		c.DBName,
		c.DBSSL,
	)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}