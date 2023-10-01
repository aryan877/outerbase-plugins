var privileges = ['cellValue', 'configuration', 'metadata', 'rowValue'];

var OuterbaseEvent = {
  // The user has triggered an action to save updates
  onSave: 'onSave',
};

var OuterbaseColumnEvent = {
  // The user has began editing the selected cell
  onEdit: 'onEdit',
  // Stops editing a cells editor popup view and accept the changes
  onStopEdit: 'onStopEdit',
  // Stops editing a cells editor popup view and prevent persisting the changes
  onCancelEdit: 'onCancelEdit',
  // Updates the cells value with the provided value
  updateCell: 'updateCell',
};

var triggerEvent = (fromClass, data) => {
  const event = new CustomEvent("custom-change", {
    detail: data,
    bubbles: true,
    composed: true
  });
  fromClass.dispatchEvent(event);
}

var templateCell_$PLUGIN_ID = document.createElement('template');
templateCell_$PLUGIN_ID.innerHTML = `
<style>
  #container { 
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px;
  }

  button {
    border: none;
    background-color: #007BFF;
    color: white;
    cursor: pointer;
    padding: 6px;
    margin-left: 12px;
    font-family: Arial, sans-serif;
    font-size: 12px; 
    border-radius: 8px;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: #0056b3;
  }

  input { 
    display: none;
  }
</style>

<div id="container">
  <input type="file" accept="image/*" id="content-value">
  <button id="open-upload">Upload</button>
  <button id="open-preview">Preview</button>
</div>
`;

var templateEditor_$PLUGIN_ID = document.createElement('template');
templateEditor_$PLUGIN_ID.innerHTML = `
  <style>
    .editor-container {
      position: relative;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f8f8;
    }

    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: #e74c3c;
      border: none;
      font-size: 20px;
      color: white;
      cursor: pointer;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      background-color: #c0392b;
    }

    .header {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .error-message {
      display: none;
      color: #e74c3c;
      margin: 10px 0;
    }

    .content {
      max-height: 400px;
      overflow: auto;
      background-color: white;
      border: 1px solid #e0e0e0;
      padding: 10px;
    }
  </style>
  
  <div class="editor-container">
    <button id="close-button" title="Close">×</button>

    <hr />
    <div class="content"></div>
  </div>
`;

var decodeAttributeByName = (fromClass, name) => {
  const encodedJSON = fromClass.getAttribute(name);
  const decodedJSON = encodedJSON
    ?.replace(/&quot;/g, '"')
    ?.replace(/&#39;/g, "'");
  return decodedJSON ? JSON.parse(decodedJSON) : {};
}

class OuterbasePluginConfig_$PLUGIN_ID {
  bucketName = undefined;
  region = undefined;
  accessKeyId = undefined;
  secretAccessKey = undefined;
  updateHook = undefined;
  s3Prefix = undefined;
  rowValue = undefined;

  constructor(object) {
    this.bucketName = object.bucketName;
    this.region = object.region;
    this.accessKeyId = object.accessKeyId;
    this.secretAccessKey = object.secretAccessKey;
    this.updateHook = object.updateHook;
    this.s3Prefix = object.s3Prefix;
  }
  toJSON() {
    return {
      "bucketName": this.bucketName,
      "region": this.region,
      "accessKeyId": this.accessKeyId,
      "secretAccessKey": this.secretAccessKey,
      "updateHook": this.updateHook,
      "s3Prefix": this.s3Prefix,
    };
  }
}

class OuterbasePluginCell_$PLUGIN_ID extends HTMLElement {
  static get observedAttributes() {
    return privileges;
  }

  config = new OuterbasePluginConfig_$PLUGIN_ID({})

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(templateCell_$PLUGIN_ID.content.cloneNode(true));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.config = new OuterbasePluginConfig_$PLUGIN_ID(decodeAttributeByName(this, "configuration"));
    this.config.rowValue = decodeAttributeByName(this, "rowValue");
    this.config.cellValue = this.getAttribute('cellValue');
  }

  connectedCallback() {
    this.loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.1126.0/aws-sdk.min.js'
    )
      .then(() => { })
      .catch((error) => {
        console.error('Error loading external script:', error);
      });

    this.fileInput = this.shadow
      .querySelector('#content-value');

    this.fileInput.addEventListener('change', (event) =>
      this.handleFileSelection(event)
    );

    this.shadow
      .querySelector('#open-upload')
      .addEventListener('click', () => this.triggerFileInputClick());

    this.shadow
      .querySelector('#open-preview')
      .addEventListener('click', () => this.showPreview());
  }

  // attributeChangedCallback(name, oldValue, newValue) {
  //   console.log(name, oldValue, newValue, 'hello');
  // }

  loadExternalScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${url} `));
      };

      document.head.appendChild(script);
    });
  }

  showPreview() {
    const event = new CustomEvent('custom-change', {
      detail: { action: 'onedit', value: true },
      bubbles: true,
      composed: true,
    });
    console.log('showing previewing')

    this.dispatchEvent(event);
  }

  handleFileSelection(event) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.uploadFileToS3(selectedFile);
    }
  }

  triggerFileInputClick() {
    this.fileInput.click();
  }

  async uploadFileToS3(file) {
    const bucketName = this.config.bucketName;
    const region = this.config.region;
    const accessKeyId = this.config.accessKeyId;
    const secretAccessKey = this.config.secretAccessKey;
    const updateHook = this.config.updateHook;
    const s3Prefix = this.config.s3Prefix;
    const rowValue = this.config.rowValue;
    const cellValue = this.config.cellValue;
    const rowPrimaryKeyValue = Object.values(rowValue)[0];
    // console.log('rowPrimaryKeyValue ->', rowPrimaryKeyValue, 'cellValue ->', cellValue);

    AWS.config.update({ accessKeyId, secretAccessKey, region });

    const selectedFile = file;

    if (!selectedFile) {
      return;
    }

    const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const fileExtension = selectedFile.name.split('.').pop();
    const fileKey = `${uniqueKey}.${fileExtension}`;
    const fileKeyWithPrefix = s3Prefix !== undefined ? `${s3Prefix}${fileKey}` : fileKey;
    // console.log('fileKeyWithPrefix->', fileKeyWithPrefix);

    const s3 = new AWS.S3();

    const params = {
      Bucket: bucketName,
      Key: fileKeyWithPrefix,
      Body: selectedFile,
      ContentType: selectedFile.type,
    };

    s3.putObject(params, (err, data) => {
      if (err) {
        console.error('Error uploading to S3:', err);
      } else {

        triggerEvent(this, {
          action: OuterbaseColumnEvent.updateCell,
          value: fileKeyWithPrefix
        });

        if (cellValue) {
          const oldParams = {
            Bucket: bucketName,
            Key: cellValue,
          };

          s3.deleteObject(oldParams, (deleteErr, deleteData) => {
            if (deleteErr) {
              console.error('Error deleting from S3:', deleteErr);
            }
          });
        }

        fetch(updateHook, {
          method: 'POST',
          body: JSON.stringify({
            newfilekey: fileKeyWithPrefix,
            oldcellvalue: rowPrimaryKeyValue,
          }),
        });
      }
    });
  }
}

class OuterbasePluginEditor_$PLUGIN_ID extends HTMLElement {
  static get observedAttributes() {
    return privileges;
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(templateEditor_$PLUGIN_ID.content.cloneNode(true));
  }

  connectedCallback() {
    this.loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.1126.0/aws-sdk.min.js'
    )
      .then(() => { })
      .catch((error) => {
        console.error('Error loading external script:', error);
      });

    this.config = new OuterbasePluginConfig_$PLUGIN_ID(
      decodeAttributeByName(this, 'configuration')
    );
    const value = this.getAttribute("cellValue");
    const bucketName = this.config.bucketName;
    const region = this.config.region;
    const accessKeyId = this.config.accessKeyId;
    const secretAccessKey = this.config.secretAccessKey;

    AWS.config.update({ accessKeyId, secretAccessKey, region });

    const s3 = new AWS.S3();

    const params = {
      Bucket: bucketName,
      Key: value,
      Expires: 900,
    };

    s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        console.error('Error generating presigned URL:', err);
      } else {
        const image = document.createElement('img');
        image.src = url;
        image.alt = 'Food Category Image';
        image.width = 200;
        image.height = 200;


        const contentDiv = this.shadow.querySelector('.content');
        contentDiv.appendChild(image);
      }
    });

    this.shadow
      .querySelector('#close-button')
      .addEventListener('click', () => this.closePreview());
  }

  loadExternalScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${url} `));
      };

      document.head.appendChild(script);
    });
  }


  closePreview() {
    const event = new CustomEvent('custom-change', {
      detail: { action: 'onstopedit', value: true },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(event);
  }
}

var templateConfiguration = document.createElement("template")
templateConfiguration.innerHTML = `
<style>
  /* Base styles */
  #configuration-container {
    display: flex;
    height: 100%;
    overflow-y: scroll;
    padding: 40px 50px 65px 40px;
  }

  .field-title {
    font-family: "Inter", sans-serif;
    font-size: 12px;
    line-height: 18px;
    font-weight: 500;
    margin: 0 0 8px 0;
  }

  select {
    width: 320px;
    height: 40px;
    margin-bottom: 16px;
    background: transparent;
    border: 1px solid #343438;
    border-radius: 8px;
    color: black;
    font-size: 14px;
    padding: 0 8px;
    cursor: pointer;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="28" viewBox="0 -960 960 960" width="32"><path fill="black" d="M480-380 276-584l16-16 188 188 188-188 16 16-204 204Z"/></svg>');
    background-position: 100%;
    background-repeat: no-repeat;
    appearance: none;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
  }

  input {
    width: 320px;
    height: 40px;
    margin-bottom: 16px;
    background: transparent;
    border: 1px solid #343438;
    border-radius: 8px;
    color: black;
    font-size: 14px;
    padding: 0 8px;
  }

  button {
    border: none;
    background-color: #834FF8;
    color: white;
    padding: 6px 18px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 18px;
    border-radius: 8px;
    cursor: pointer;
  }

  .preview-card {
    margin-left: 80px;
    width: 240px;
    background-color: white;
    border-radius: 16px;
    overflow: hidden;
  }

  .preview-card > img {
    width: 100%;
    height: 165px;
  }

  .preview-card > div {
    padding: 16px;
    display: flex;
    flex-direction: column;
    color: black;
  }

  .preview-card > div > p {
    margin: 0;
  }

  /* Dark mode styles */
  .dark {
    #configuration-container {
      background-color: black;
      color: white;
    }

    #configuration-container input,
    #configuration-container select {
      color: white !important;
    }

    #configuration-container select {
      background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="28" viewBox="0 -960 960 960" width="32"><path fill="white" d="M480-380 276-584l16-16 188 188 188-188 16 16-204 204Z"/></svg>');
    }
  }
</style>

<div id="theme-container">
  <div id="configuration-container">
      
  </div>
</div>
`

class OuterbasePluginConfiguration_$PLUGIN_ID extends HTMLElement {
  static get observedAttributes() {
    return privileges
  }

  config = new OuterbasePluginConfig_$PLUGIN_ID({})

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.appendChild(templateConfiguration.content.cloneNode(true))
  }

  connectedCallback() {
    this.render()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.config = new OuterbasePluginConfig_$PLUGIN_ID(decodeAttributeByName(this, "configuration"))
    // this.config.tableValue = decodeAttributeByName(this, "tableValue")
    this.config.theme = decodeAttributeByName(this, "metadata").theme
    var element = this.shadow.getElementById("theme-container");
    element.classList.remove("dark")
    element.classList.add(this.config.theme);
    this.render()
  }

  render() {
    if (!this.shadow.querySelector('#configuration-container')) return;

    this.shadow.querySelector('#configuration-container').innerHTML = `
      <div style="flex: 1;">
        <p class="field-title">S3 Bucket Name</p>
        <input id="bucketNameInput" type="text" value="${this.config.bucketName || ''}"/>
  
        <p class="field-title">Region</p>
        <input id="regionInput" type="text" value="${this.config.region || ''}"/>
  
        <p class="field-title">Access Key ( AWS )</p>
        <input id="accessKeyInput" type="text" value="${this.config.accessKeyId || ''}"/>
  
        <p class="field-title">Secret Access Key ( AWS )</p>
        <input id="secretAccessKeyInput" type="text" value="${this.config.secretAccessKey || ''}"/>
  
        <p class="field-title">Update Hook</p>
        <input id="updateHookInput" type="text" value="${this.config.updateHook || ''}"/>
  
        <p class="field-title">S3 Prefix (Optional)</p>
        <input id="s3PrefixInput" type="text" value="${this.config.s3Prefix || ''}"/>
  
        <div style="margin-top: 8px;">
          <button id="saveButton">Save View</button>
        </div>
      </div>`;

    var saveButton = this.shadow.getElementById("saveButton");


    saveButton.addEventListener("click", () => {
      this.config.bucketName = this.shadow.getElementById("bucketNameInput").value;
      this.config.region = this.shadow.getElementById("regionInput").value;
      this.config.accessKeyId = this.shadow.getElementById("accessKeyInput").value;
      this.config.secretAccessKey = this.shadow.getElementById("secretAccessKeyInput").value;
      this.config.updateHook = this.shadow.getElementById("updateHookInput").value;
      this.config.s3Prefix = this.shadow.getElementById("s3PrefixInput").value;

      triggerEvent(this, {
        action: OuterbaseEvent.onSave,
        value: this.config.toJSON()
      });
    });
  }

}

window.customElements.define(
  'outerbase-plugin-cell-$PLUGIN_ID',
  OuterbasePluginCell_$PLUGIN_ID
);

window.customElements.define(
  'outerbase-plugin-editor-$PLUGIN_ID',
  OuterbasePluginEditor_$PLUGIN_ID
);

window.customElements.define(
  'outerbase-plugin-configuration-$PLUGIN_ID',
  OuterbasePluginConfiguration_$PLUGIN_ID
)