export class DebugOverlay {
  constructor() {
    this.container = null;
    this.log = [];
    this.createContainer();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'nexaApply-debug';
    this.container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        overflow-y: auto;
        display: none;
    `;

    document.body.appendChild(this.container);
    this.render();
  }

  show() {
    this.container.style.display = 'block';
    this.logMessage('Debug mode activated');
  }

  hide() {
    this.container.style.display = 'none';
    this.log = [];
    this.render();
  }

  logMessage(message, type = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      type,
    };

    this.log.unshift(entry);
    if (this.log.length > 100) {
      this.log.pop();
    }

    this.render();
  }

  showError(error) {
    this.logMessage(error, 'error');
  }
  render() {
    const html = this.log.map(
      (entry) => `
      <div class="debug-entry" style="margin-bottom: 5px; ${
        entry.type === 'error' ? 'color: #ff6b6b;' : ''
      }">
        <span class="timestamp" style="color: #69c0ff;">[${
          entry.timestamp.split('T')[1].split('.')[0]
        }]</span>
        <span class="message">${entry.message}</span>
      </div>
    \`).join('');
    
    this.container.innerHTML = \`
      <div style="margin-bottom: 10px; border-bottom: 1px solid #666; padding-bottom: 5px;">
        nexaApply Debug Console
        <span style="float: right; cursor: pointer;" onclick="this.parentElement.parentElement.style.display='none'">x</span>
      </div>
      <div class="debug-log">
        ${html}
      </div>
    `
    );
  }
}
