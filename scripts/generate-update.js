const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const yaml = require("js-yaml"); // Add this dependency

// Configuration
const config = {
  baseUrl: process.env.baseUrl || "http://localhost:8000/public",
  buildDir: path.join(__dirname, "../dist"),
  publicDir: path.join(__dirname, "../public"),
  platforms: ["win", "linux"],
};

function getFileInfo(filePath) {
  try {
    const file = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha512");
    hash.update(file);
    const sha512 = hash.digest("hex"); // Changed to hex as per docs
    const stats = fs.statSync(filePath);
    return { sha512, size: stats.size };
  } catch (error) {
    console.log(`Error processing ${filePath}: ${error.message}`);
    return null;
  }
}

function generateUpdateFiles() {
  const packageJson = require("../package.json");
  const version = packageJson.version;

  // Process each platform
  config.platforms.forEach((platform) => {
    const pattern = platform === "win" ? ".exe" : ".AppImage";
    const files = fs
      .readdirSync(config.buildDir)
      .filter((file) => file.toLowerCase().endsWith(pattern.toLowerCase()));

    if (files.length === 0) {
      console.log(`No ${platform} files found`);
      return;
    }

    const file = files[0]; // Take the first matching file
    const filePath = path.join(config.buildDir, file);
    const fileInfo = getFileInfo(filePath);

    if (!fileInfo) return;

    // Create platform-specific YAML
    const updateData = {
      version,
      files: [
        {
          url: `${config.baseUrl}/${encodeURIComponent(file)}`,
          sha512: fileInfo.sha512,
          size: fileInfo.size,
        },
      ],
      path: file,
      sha512: fileInfo.sha512,
      releaseDate: new Date().toISOString(),
    };

    // Ensure public directory exists
    if (!fs.existsSync(config.publicDir)) {
      fs.mkdirSync(config.publicDir, { recursive: true });
    }

    // Write platform-specific YAML file
    const yamlFile = `latest-${platform}.yml`;
    const yamlPath = path.join(config.publicDir, yamlFile);
    fs.writeFileSync(yamlPath, yaml.dump(updateData));
    console.log(`Generated ${yamlFile}`);

    // Copy the binary to public directory
    fs.copyFileSync(filePath, path.join(config.publicDir, file));
    console.log(`Copied ${file} to public directory`);
  });
}

// Run the generator
try {
  console.log("Generating update files...");
  generateUpdateFiles();
  console.log("Update files generated successfully");
} catch (error) {
  console.error("Error generating update files:", error);
  process.exit(1);
}
