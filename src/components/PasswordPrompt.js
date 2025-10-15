class PasswordPrompt {
    constructor(onSubmit) {
        this.onSubmit = onSubmit;
        this.createPrompt();
    }

    createPrompt() {
        this.promptContainer = document.createElement('div');
        this.promptContainer.className = 'password-prompt';

        const promptMessage = document.createElement('p');
        promptMessage.textContent = 'Enter password to continue watching:';
        this.promptContainer.appendChild(promptMessage);

        this.passwordInput = document.createElement('input');
        this.passwordInput.type = 'password';
        this.promptContainer.appendChild(this.passwordInput);

        this.submitButton = document.createElement('button');
        this.submitButton.textContent = 'Submit';
        this.submitButton.onclick = () => this.handleSubmit();
        this.promptContainer.appendChild(this.submitButton);

        document.body.appendChild(this.promptContainer);
    }

    handleSubmit() {
        const password = this.passwordInput.value;
        if (this.onSubmit(password)) {
            this.closePrompt();
        } else {
            alert('Incorrect password. Please try again.');
        }
    }

    closePrompt() {
        document.body.removeChild(this.promptContainer);
    }
}

export default PasswordPrompt;