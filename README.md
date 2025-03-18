# PEST PHP for VSCode

This Visual Studio Code extension provides comprehensive support for the PEST PHP testing framework, enhancing your testing workflow within VS Code.

![Screenshot](./assets/screenshot.gif)

## Features

This extension introduces several powerful features to improve your experience with PEST PHP in Visual Studio Code:

- **List All Test Cases**: Easily view all available test cases within your project.
- **Show Failed Test Messages**: Directly see which tests failed and why, with detailed failure messages alongside the failed test cases.
- **Run Test Case from File**: Conveniently run specific test cases directly from the file editor with a simple click or shortcut.

These features are designed to streamline your testing process, making it more efficient and integrated within your VS Code environment.

> **Note**: This is the first release of the extension, focusing on core functionalities to enhance your PEST PHP testing. Future updates will aim to expand features and improve user experience.

## Configuration

You can configure the extension to use Docker and update the PEST PHP path. The configuration is in JSON format with the following keys:

- `pestphp.docker.command`: Docker command to be used to run the command inside. Default is `docker exec`.
- `pestphp.docker.container_name`: The name of the Docker container where PEST PHP is installed.
- `pestphp.path`: The path to the PEST PHP executable.

Example configuration in your `settings.json`:

```json
{
    "pestphp.docker.container_name": "my_docker_container",
    "pestphp.path": "/path/to/pest"
}
```

## Supported OS

This extension has been tested and confirmed to work on the following operating systems:

- **OSX**: Fully supported and tested.

> **Linux Support**: Currently, Linux OS has not been tested. We welcome feedback and contributions to extend support to Linux users in future releases.

> **Windows Support**: Currently, Windows OS has not been tested. We welcome feedback and contributions to extend support to Windows users in future releases.

## Requirements

To use this extension, ensure that you have PEST PHP installed and configured within your project. For more information on setting up PEST PHP, visit the [official PEST PHP documentation](https://pestphp.com/docs/installation).


## Known Issues

As this is the first release, there might be undiscovered issues. We encourage users to report any bugs or issues they encounter to help improve the extension.

## Contributing

We have a comprehensive list of tasks and enhancements planned for future releases in our TODO file. If you're interested in contributing and supporting the development of this extension, here's how you can help:

1. **Check the TODO File**: Start by reviewing the TODO file in our repository. It contains a list of pending tasks, feature requests, and known issues that need attention.

2. **Pick a Task**: Choose a task that you're interested in working on. Tasks vary in complexity and scope, so there's something for everyone, whether you're a beginner or an experienced developer.

3. **Get in Touch**: Before you start working on a task, please get in touch with us (details in the GitHub repository). This helps us coordinate contributions and ensures that multiple people aren't working on the same issue simultaneously.

4. **Submit Your Contribution**: After completing a task, submit your contribution through a pull request. Please include a detailed description of your changes and any other relevant information.

Your contributions are invaluable to us, and by helping with the tasks listed in the TODO file, you're directly impacting the improvement and growth of this extension. Together, we can make this tool even better for the PEST PHP community.

Thank you for considering to contribute and support our project. We look forward to seeing your contributions!

---

We hope this extension significantly improves your testing workflow with PEST PHP in Visual Studio Code. Happy testing!