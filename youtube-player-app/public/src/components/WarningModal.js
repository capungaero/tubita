class WarningModal {
    constructor(onPasswordSubmit) {
        this.onPasswordSubmit = onPasswordSubmit;
        this.modalElement = this.createModal();
        this.isVisible = false;
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'warning-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Time Limit Reached</h2>
                <p>Your viewing time is up. Please enter the password to continue watching.</p>
                <input type="password" id="password-input" placeholder="Enter password" />
                <button id="submit-password">Submit</button>
                <button id="close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#submit-password').addEventListener('click', () => {
            const password = modal.querySelector('#password-input').value;
            this.onPasswordSubmit(password);
        });

        modal.querySelector('#close-modal').addEventListener('click', () => {
            this.hide();
        });

        return modal;
    }

    show() {
        this.modalElement.style.display = 'block';
        this.isVisible = true;
    }

    hide() {
        this.modalElement.style.display = 'none';
        this.isVisible = false;
    }
}

export default WarningModal;