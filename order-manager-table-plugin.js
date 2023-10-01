var observableAttributes = [
  // The value of the cell that the plugin is being rendered in
  "cellvalue",
  // The value of the row that the plugin is being rendered in
  "rowvalue",
  // The value of the table that the plugin is being rendered in
  "tablevalue",
  // The schema of the table that the plugin is being rendered in
  "tableschemavalue",
  // The schema of the database that the plugin is being rendered in
  "databaseschemavalue",
  // The configuration object that the user specified when installing the plugin
  "configuration",
  // Additional information about the view such as count, page and offset.
  "metadata"
]

var OuterbaseEvent = {
  // The user has triggered an action to save updates
  onSave: "onSave",
  // The user has triggered an action to configure the plugin
  configurePlugin: "configurePlugin",
}

var OuterbaseColumnEvent = {
  // The user has began editing the selected cell
  onEdit: "onEdit",
  // Stops editing a cells editor popup view and accept the changes
  onStopEdit: "onStopEdit",
  // Stops editing a cells editor popup view and prevent persisting the changes
  onCancelEdit: "onCancelEdit",
  // Updates the cells value with the provided value
  updateCell: "updateCell",
}

var OuterbaseTableEvent = {
  // Updates the value of a row with the provided JSON value
  updateRow: "updateRow",
  // Deletes an entire row with the provided JSON value
  deleteRow: "deleteRow",
  // Creates a new row with the provided JSON value
  createRow: "createRow",
  // Performs an action to get the next page of results, if they exist
  getNextPage: "getNextPage",
  // Performs an action to get the previous page of results, if they exist
  getPreviousPage: "getPreviousPage"
}

/**
* ******************
* Custom Definitions
* ******************
* 
*  ░░░░░░░░░░░░░░░░░
*  ░░░░▄▄████▄▄░░░░░
*  ░░░██████████░░░░
*  ░░░██▄▄██▄▄██░░░░
*  ░░░░▄▀▄▀▀▄▀▄░░░░░
*  ░░░▀░░░░░░░░▀░░░░
*  ░░░░░░░░░░░░░░░░░
* 
* Define your custom classes here. We do recommend the usage of our `OuterbasePluginConfig_$PLUGIN_ID`
* class for you to manage properties between the other classes below, however, it's strictly optional.
* However, this would be a good class to contain the properties you need to store when a user installs
* or configures your plugin.
*/
class OuterbasePluginConfig_$PLUGIN_ID {
  // Inputs from Outerbase for us to retain
  tableValue = undefined
  count = 0
  limit = 0
  offset = 0
  page = 0
  pageCount = 0
  theme = "light"

  // Inputs from the configuration screen
  // imageKey = undefined
  currency = undefined
  orderIdKey = undefined
  phoneNumberKey = undefined
  totalPriceKey = undefined
  orderStatusKey = undefined
  latitudeKey = undefined
  longitudeKey = undefined
  paymentStatusKey = undefined

  constructor(object) {
    // this.imageKey = object?.imageKey
    this.currency = object?.currency
    this.orderIdKey = object?.orderIdKey
    this.phoneNumberKey = object?.phoneNumberKey
    this.totalPriceKey = object?.totalPriceKey
    this.orderStatusKey = object?.orderStatusKey
    this.latitudeKey = object?.latitudeKey
    this.longitudeKey = object?.longitudeKey
    this.paymentStatusKey = object?.paymentStatusKey
  }

  toJSON() {
    return {
      // "imageKey": this.imageKey,
      "currency": this.currency,
      "orderIdKey": this.orderIdKey,
      "phoneNumberKey": this.phoneNumberKey,
      "totalPriceKey": this.totalPriceKey,
      "orderStatusKey": this.orderStatusKey,
      "latitudeKey": this.latitudeKey,
      "longitudeKey": this.longitudeKey,
      "paymentStatusKey": this.paymentStatusKey
    }
  }
}

var triggerEvent = (fromClass, data) => {
  const event = new CustomEvent("custom-change", {
    detail: data,
    bubbles: true,
    composed: true
  });

  fromClass.dispatchEvent(event);
}

var decodeAttributeByName = (fromClass, name) => {
  const encodedJSON = fromClass.getAttribute(name);
  const decodedJSON = encodedJSON
    ?.replace(/&quot;/g, '"')
    ?.replace(/&#39;/g, "'");
  return decodedJSON ? JSON.parse(decodedJSON) : {};
}

var encodeAttributeByName = (value) => {
  const encodedJSON = JSON.stringify(value);
  const encodedHTML = encodedJSON
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return encodedHTML;
}

/**
* **********
* Table View
* **********
* 
*  ░░░░░░░░░░░░░░░░░░
*  ░░░░░▄▄████▄▄░░░░░
*  ░░░▄██████████▄░░░
*  ░▄██▄██▄██▄██▄██▄░
*  ░░░▀█▀░░▀▀░░▀█▀░░░
*  ░░░░░░░░░░░░░░░░░░
*  ░░░░░░░░░░░░░░░░░░
*/

var templateTable = document.createElement("template");
templateTable.innerHTML = `
<style>
  /* Your CSS styles here... */

  /* General styles */
  #theme-container {
    height: 100%;
  }

  #search-container {
    max-width : 1400px;
  }

  #container-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: scroll;
    padding: 20px;
    max-width : 1400px;
  }

  #container {
  }

  h1 {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .search-bar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  #searchInput {
    flex-grow: 1;
    height: 40px;
    margin-right: 10px;
    padding: 0 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .grid-item {
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
  }

  .contents {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  p {
    margin: 0;
  }

  .commonButton {
    background-color: transparent; 
    color: #000; /* Black text */
    border: 1px solid #000; /* Black border */
    border-radius: 8px;
    padding: 8px;
    margin-top: 10px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
  }

  .commonButton:hover {
    background-color: transparent; 
    border-color: #FF3030; 
  }

  .table-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .table-action-button {
    background-color: #FF3030; /* Red background */
    color: #fff; /* White text */
    border: none; /* No border */
    border-radius: 8px;
    cursor: pointer;
    padding: 6px 18px;
    font: "Inter", sans-serif;
    font-size: 14px;
    line-height: 18px;
  }
  
  .table-action-button:hover {
    background-color: #CC1010; /* Darker red on hover */
  }
  
  #configurePluginButton {
    height: 40px;
    background-color: #FF3030; /* Red background */
    color: #fff; /* White text */
    border: none; /* No border */
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
  }
  
  #configurePluginButton:hover {
    background-color: #CC1010; /* Darker red on hover */
  }  
  
  /* Dark mode styles */
  .dark .table-action-button {
    background-color: black;
  }

  .dark #configurePluginButton svg {
    fill: white;
  }

  .card-title {
    font-weight: bold;
  }

  .card-subtitle {
    color: #777;
  }

  .page-details {
    margin-top: 20px;
    text-align: center;
    padding-bottom: 20px;
  }

  .modal {
    display: none;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
  }
  
  .modal-content {
    background-color: white;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #888;
    width: 60%;
    text-align: center;
    border-radius: 8px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  .modal-buttons {
    margin-top: 20px;
  }
  
  .modal-buttons button {
    background-color: #FF3030;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    margin: 0 10px;
    cursor: pointer;
  }
  
  .modal-buttons button:hover {
    background-color: #CC0000;
  }  

  .current-status-button {
    background-color: #FF3030;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px;
    margin-top: 10px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
  }

  .current-status-button:hover {
    background-color: #CC0000;
  }

  .delivered-card {
    background-color: #ffdddd;
  }

  .badge {
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    text-transform: uppercase;
    width: 60px; /* Adjust the width as needed */
    text-align: center;
    margin-bottom: 8px;
  }
  
  .paid-badge {
    background-color: #4CAF50; 
    color: white;
  }
  
  .unpaid-badge {
    background-color: #FF3030;
    color: white;
  }
  
  .dark {
    /* Add dark mode styles here */
  }
</style>

<div id="theme-container">
    <div id="confirmationModal" class="modal">
      <div class="modal-content">
          <p id="confirmationModal-prompt">Are you sure you want to mark this order as [status]?</p>
          <div class="modal-buttons">
            <button id="confirmYesButton">Yes</button>
            <button id="confirmNoButton">No</button>
          </div>
      </div>
    </div>
    <div id="container-wrapper">
    <div id="search-container">
      <h1>Welcome to Bloom Order Manager!</h1>
        <div class="search-bar">
          <input type="text" id="searchInput" placeholder="Search by Order ID">
        </div>
    </div>
    <div id="container">
    </div>
    </div>
</div>
`;

// Can the above div just be a self closing container: <div />
class OuterbasePluginTable_$PLUGIN_ID extends HTMLElement {
  static get observedAttributes() {
    return observableAttributes
  }

  config = new OuterbasePluginConfig_$PLUGIN_ID({})

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.appendChild(templateTable.content.cloneNode(true))
  }

  connectedCallback() {
    this.render()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.config = new OuterbasePluginConfig_$PLUGIN_ID(decodeAttributeByName(this, "configuration"))
    this.config.tableValue = decodeAttributeByName(this, "tableValue")
    let metadata = decodeAttributeByName(this, "metadata")
    this.config.count = metadata?.count
    this.config.limit = metadata?.limit
    this.config.offset = metadata?.offset
    this.config.theme = metadata?.theme
    this.config.page = metadata?.page
    this.config.pageCount = metadata?.pageCount
    var element = this.shadow.getElementById("theme-container");
    element.classList.remove("dark")
    //adding theme class to the theme-container
    element.classList.add(this.config.theme);
    this.render()
  }

  // 'Preparation Started',
  // 'Delivered',
  // 'On The Way'

  render() {
    this.shadow.querySelector("#container").innerHTML =
      `<div class="grid-container">
      ${this.config?.tableValue?.length && this.config?.tableValue?.map((row) => `
        <div class="grid-item ${row[this.config.orderStatusKey] === 'Delivered' ? 'delivered-card' : ''}">
          <div class="contents">
            ${this.config.orderIdKey ? `<p class="card-title">Order ID: ${row[this.config.orderIdKey]}</p>` : ''}
            ${this.config.totalPriceKey ? `<p class="card-subtitle">Item Price: ${this.config.currency ? this.config.currency + ' ' : ''}${row[this.config.totalPriceKey]}</p>` : ''}
            ${this.config.phoneNumberKey ? `<p class="card-subtitle">User Phone Number: ${row[this.config.phoneNumberKey]}</p>` : ''}
            <div class="badge ${row[this.config.paymentStatusKey] ? 'paid-badge' : 'unpaid-badge'}">${row[this.config.paymentStatusKey] ? 'Paid' : 'Unpaid'}</div>
            <button class="markPreparingButton commonButton ${row[this.config.orderStatusKey] === 'Preparation Started' ? 'current-status-button' : ''}" data-order-id="${row[this.config.orderIdKey]}">Mark as Preparing</button>
            <button class="markOnTheWayButton commonButton ${row[this.config.orderStatusKey] === 'On The Way' ? 'current-status-button' : ''}" data-order-id="${row[this.config.orderIdKey]}">Mark as On the Way</button>
            <button class="markDeliveredButton commonButton ${row[this.config.orderStatusKey] === 'Delivered' ? 'current-status-button' : ''}" data-order-id="${row[this.config.orderIdKey]}">Mark as Delivered</button>              
          </div>
        </div>
      `).join('')}
    </div>    
    
      <div class="table-actions">
        <button id="previousPageButton" class="table-action-button">Previous Page</button>
        <button id="nextPageButton" class="table-action-button">Next Page</button>
      </div>
      <button id="configurePluginButton">
        Configure Plugin
      </button>
    
      <div class="page-details">
        Viewing ${this.config.offset} - ${this.config.limit} of ${this.config.count} results<br>
        Page ${this.config.page} of ${this.config.pageCount}<br>
        You're using the <b>${this.config.theme}</b> theme
      </div>`;

    var configurePluginButton = this.shadow.getElementById("configurePluginButton");
    configurePluginButton.addEventListener("click", () => {
      triggerEvent(this, {
        action: OuterbaseEvent.configurePlugin
      })
    });

    const searchInput = this.shadow.getElementById('searchInput');


    searchInput.addEventListener('input', () => {
      const searchText = searchInput.value;
      this.config.tableValue = decodeAttributeByName(this, "tableValue")
      const filteredTableValue = this.config.tableValue.filter((row) => {
        return String(row[this.config.orderIdKey])?.startsWith(searchText);
      });
      this.config.tableValue = filteredTableValue;
      this.render()
    });

    //DELIVERY STATUS IN DATABASE:
    // 'Preparation Started',
    // 'Delivered',
    // 'On The Way'

    const markPreparingButtons = this.shadow.querySelectorAll('.markPreparingButton');
    const markOnTheWayButtons = this.shadow.querySelectorAll('.markOnTheWayButton');
    const markDeliveredButtons = this.shadow.querySelectorAll('.markDeliveredButton');

    markPreparingButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        showConfirmationModal('Preparing', btn.getAttribute('data-order-id'), () => {
          sendMarkStatusRequest(btn.getAttribute('data-order-id'), 'Preparation Started', this.config.tableValue, index);
        });
      });
    });

    markOnTheWayButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        showConfirmationModal('On The Way', btn.getAttribute('data-order-id'), () => {
          sendMarkStatusRequest(btn.getAttribute('data-order-id'), 'On The Way', this.config.tableValue, index);
        });
      });
    });

    markDeliveredButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        showConfirmationModal('Delivered', btn.getAttribute('data-order-id'), () => {
          sendMarkStatusRequest(btn.getAttribute('data-order-id'), 'Delivered', this.config.tableValue, index);
        });
      });
    });

    function showConfirmationModal(status, orderid, callback) {
      const shadow = document.getElementById('plugin-component').shadowRoot;
      const modal = shadow.querySelector('#confirmationModal');
      const message = shadow.querySelector('#confirmationModal-prompt');
      const confirmYes = shadow.querySelector('#confirmYesButton');
      const confirmNo = shadow.querySelector('#confirmNoButton');

      message.textContent = `Are you sure you want to mark orderID ${orderid} as ${status}?`;

      function handleConfirmYesClick() {
        modal.style.display = 'none';
        callback();
        confirmYes.removeEventListener('click', handleConfirmYesClick);
        confirmNo.removeEventListener('click', handleConfirmNoClick);
      }

      function handleConfirmNoClick() {
        modal.style.display = 'none';
        confirmYes.removeEventListener('click', handleConfirmYesClick);
        confirmNo.removeEventListener('click', handleConfirmNoClick);
      }

      confirmYes.addEventListener('click', handleConfirmYesClick);
      confirmNo.addEventListener('click', handleConfirmNoClick);


      modal.style.display = 'block';
    }

    // const decodeJSON = (encodedJSON) => {
    //   const decodedJSON = encodedJSON
    //     ?.replace(/&quot;/g, '"')
    //     ?.replace(/&#39;/g, "'");
    //   return decodedJSON ? JSON.parse(decodedJSON) : {};
    // }

    async function sendMarkStatusRequest(orderId, status, tableValue, index) {
      if (index >= 0 && index < tableValue.length) {
        tableValue[index].delivery_status = status;
        const shadow = document.getElementById('plugin-component').shadowRoot;
        const encodedValue = encodeAttributeByName(tableValue);
        shadow.host.setAttribute('tableValue', encodedValue);
        fetch(
          "https://zestful-tomato.cmd.outerbase.io/update-order-delivery-status",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              orderid: orderId,
              status: status
            }),
          }
        );
      } else {
        console.log(`Invalid index ${index} for order with ID ${orderId}`);
      }
    }
    // try {
    //   const response = await fetch(
    //     "https://adjacent-apricot.cmd.outerbase.io/mark-status",
    //     {
    //       method: "POST",
    //       headers: {
    //         "content-type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         id: orderId,
    //         status: status,
    //       }),
    //     }
    //   );

    //   if (response.ok) {
    //     // Request was successful, handle it here
    //     console.log(`Order marked as ${status} successfully.`);
    //   } else {
    //     // Request failed, handle errors here
    //     console.error(`Error marking order as ${status}.`);
    //   }
    // } catch (error) {
    //   // Handle network or other errors
    //   console.error("An error occurred:", error);
    // }

    var previousPageButton = this.shadow.getElementById("previousPageButton");


    previousPageButton.addEventListener("click", () => {
      triggerEvent(this, {
        action: OuterbaseTableEvent.getPreviousPage,
        value: {}
      })
    });

    var nextPageButton = this.shadow.getElementById("nextPageButton");
    nextPageButton.addEventListener("click", () => {
      triggerEvent(this, {
        action: OuterbaseTableEvent.getNextPage,
        value: {}
      })
    });
  }
}


/**
* ******************
* Configuration View
* ******************
* 
*  ░░░░░░░░░░░░░░░░░
*  ░░░░░▀▄░░░▄▀░░░░░
*  ░░░░▄█▀███▀█▄░░░░
*  ░░░█▀███████▀█░░░
*  ░░░█░█▀▀▀▀▀█░█░░░
*  ░░░░░░▀▀░▀▀░░░░░░
*  ░░░░░░░░░░░░░░░░░
* 
* When a user either installs a plugin onto a table resource for the first time
* or they configure an existing installation, this is the view that is presented
* to the user. For many plugin applications it's essential to capture information
* that is required to allow your plugin to work correctly and this is the best
* place to do it.
* 
* It is a requirement that a save button that triggers the `OuterbaseEvent.onSave`
* event exists so Outerbase can complete the installation or preference update
* action.
*/
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
// Can the above div just be a self closing container: <div />

class OuterbasePluginConfiguration_$PLUGIN_ID extends HTMLElement {
  static get observedAttributes() {
    return observableAttributes
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
    this.config.tableValue = decodeAttributeByName(this, "tableValue")
    this.config.theme = decodeAttributeByName(this, "metadata").theme

    var element = this.shadow.getElementById("theme-container");
    element.classList.remove("dark")
    element.classList.add(this.config.theme);

    this.render()
  }

  render() {
    let sample = this.config.tableValue.length ? this.config.tableValue[0] : {}
    let keys = Object.keys(sample)

    if (!keys || keys.length === 0 || !this.shadow.querySelector('#configuration-container')) return

    this.shadow.querySelector('#configuration-container').innerHTML = `
      <div style="flex: 1;">
          <p class="field-title">OrderID Key</p>
          <select id="orderIdKeySelect">
              ` + keys.map((key) => `<option value="${key}" ${key === this.config.orderIdKey ? 'selected' : ''}>${key}</option>`).join("") + `
          </select>

          <p class="field-title">Currency (use symbols like $, ₹)</p>
          <input id="currencyInput" type="text" value=""/>

          <p class="field-title">Phone Number Key</p>
          <select id="phoneNumberKeySelect">
              ` + keys.map((key) => `<option value="${key}" ${key === this.config.phoneNumberKey ? 'selected' : ''}>${key}</option>`).join("") + `
          </select>

          <p class="field-title">Price Key</p>
          <select id="totalPriceKeySelect">
              ` + keys.map((key) => `<option value="${key}" ${key === this.config.totalPriceKey ? 'selected' : ''}>${key}</option>`).join("") + `
          </select>

          <p class="field-title">Delivery Status Key</p>
          <select id="orderStatusKeySelect">
              ` + keys.map((key) => `<option value="${key}" ${key === this.config.orderStatusKey ? 'selected' : ''}>${key}</option>`).join("") + `
          </select>

          <p class="field-title">Payment Status Key ( Paid/Unpaid )</p>
          <select id="paymentStatusKeySelect">
              ` + keys.map((key) => `<option value="${key}" ${key === this.config.paymentStatusKey ? 'selected' : ''}>${key}</option>`).join("") + `
          </select>

          <p class="field-title">Latitude Key</p>
          <select id="latitudeKeySelect">
              ` + keys.map((key) => `<option value="${key}" ${key === this.config.latitudeKey ? 'selected' : ''}>${key}</option>`).join("") + `
          </select>

          <p class="field-title">Longitude Key</p>
          <select id="longitudeKeySelect">
              ` + keys.map((key) => `<option value="${key}" ${key === this.config.longitudeKey ? 'selected' : ''}>${key}</option>`).join("") + `
          </select>


          <div style="margin-top: 8px;">
            <button id="saveButton">Save View</button>
          </div>
      </div>`

    //     <div style="position: relative;">
    //     <div class="preview-card">
    //         <div>
    //             <p style="margin-bottom: 8px; font-weight: bold; font-size: 16px; line-height: 24px; font-family: 'Inter', sans-serif;">${sample[this.config.orderIdKey]}</p>
    //             <p style="margin-bottom: 8px; font-size: 14px; line-height: 21px; font-weight: 400; font-family: 'Inter', sans-serif;">${sample[this.config.phoneNumberKey]}</p>
    //             <p style="margin-top: 12px; font-size: 12px; line-height: 16px; font-family: 'Inter', sans-serif; color: gray; font-weight: 300;">${sample[this.config.totalPriceKey]}</p>
    //         </div>
    //     </div>
    // </div>
    var saveButton = this.shadow.getElementById("saveButton");
    saveButton.addEventListener("click", () => {
      triggerEvent(this, {
        action: OuterbaseEvent.onSave,
        value: this.config.toJSON()
      })
    });

    var currencyInput = this.shadow.getElementById("currencyInput");
    currencyInput.addEventListener("input", () => {
      console.log(currencyInput.value)
      this.config.currency = currencyInput.value;
      // this.render();
    });

    var orderIdKeySelect = this.shadow.getElementById("orderIdKeySelect");
    orderIdKeySelect.addEventListener("change", () => {
      this.config.orderIdKey = orderIdKeySelect.value
      this.render()
    });

    var phoneNumberKeySelect = this.shadow.getElementById("phoneNumberKeySelect");
    phoneNumberKeySelect.addEventListener("change", () => {
      this.config.phoneNumberKey = phoneNumberKeySelect.value
      this.render()
    });

    var totalPriceKeySelect = this.shadow.getElementById("totalPriceKeySelect");
    totalPriceKeySelect.addEventListener("change", () => {
      this.config.totalPriceKey = totalPriceKeySelect.value
      this.render()
    });

    var orderStatusKeySelect = this.shadow.getElementById("orderStatusKeySelect");
    orderStatusKeySelect.addEventListener("change", () => {
      this.config.orderStatusKey = orderStatusKeySelect.value
      this.render()
    });

    var paymentStatusKeySelect = this.shadow.getElementById("paymentStatusKeySelect");
    paymentStatusKeySelect.addEventListener("change", () => {
      this.config.paymentStatusKey = paymentStatusKeySelect.value
      this.render()
    });

    var latitudeKeySelect = this.shadow.getElementById("latitudeKeySelect");
    latitudeKeySelect.addEventListener("change", () => {
      this.config.latitudeKey = latitudeKeySelect.value
      this.render()
    });

    var longitudeKeySelect = this.shadow.getElementById("longitudeKeySelect");
    longitudeKeySelect.addEventListener("change", () => {
      this.config.longitudeKey = longitudeKeySelect.value
      this.render()
    });
  }
}

window.customElements.define('outerbase-plugin-table-$PLUGIN_ID', OuterbasePluginTable_$PLUGIN_ID)
window.customElements.define('outerbase-plugin-configuration-$PLUGIN_ID', OuterbasePluginConfiguration_$PLUGIN_ID)