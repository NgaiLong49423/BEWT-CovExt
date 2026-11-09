package tests;

/** Runtime-only settings supplied through the process environment. */
public final class ExperimentConfig {
    private ExperimentConfig() {}
    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalStateException("Required runtime environment variable is missing: " + name);
        return value;
    }
    public static String appUrl() { return required("BEWT_APP_URL"); }
    public static String installUrl() { return required("BEWT_INSTALL_URL"); }
    public static String webdriverUrl() { return required("BEWT_WEBDRIVER_URL"); }
    public static String adminUsername() { return required("BEWT_ADMIN_USERNAME"); }
    public static String adminPassword() { return required("BEWT_ADMIN_PASSWORD"); }
    public static String alternatePassword() { return required("BEWT_ADMIN_PASSWORD_ROTATED"); }
    public static String adminEmail() { return required("BEWT_ADMIN_EMAIL"); }
    public static String databaseHost() { return required("BEWT_DB_HOST"); }
    public static String databaseUser() { return required("BEWT_DB_USER"); }
    public static String databasePassword() { return required("BEWT_DB_PASSWORD"); }
    public static String databaseName() { return required("BEWT_DB_NAME"); }
}
