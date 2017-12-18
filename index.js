const axios = require('axios');
const inquirer = require('inquirer');
const addressValidator = require('address-validator');
const LOB_KEY = 'test_872404894d313d20f6f263e5bcd0b3b5476';
const lob = require('lob')(LOB_KEY);

const GOOGLE_KEY = 'AIzaSyB4ZBcHLG0I3p4TYLrsaiMmQKPVdNUloHM';

class lobMailer {
  constructor() {
    this.addressPrompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Please enter your name:',
        validate: input => {
          if (!input) return 'Name Required';
          return true;
        }
      },
      {
        type: 'input',
        name: 'line1',
        message: 'Please enter line 1 of your address:',
        validate: input => {
          if (!input) return 'Address Required';
          return true;
        }
      },
      {
        type: 'input',
        name: 'line2',
        message: 'Please enter line 2 of your address:'
      },
      {
        type: 'input',
        name: 'city',
        message: 'Please enter your city:',
        validate: input => {
          if (!input) return 'City Required';
          return true;
        }
      },
      {
        type: 'input',
        name: 'state',
        message: 'Please enter your state:',
        validate: input => {
          if (!input) return 'State Required';
          return true;
        }
      },
      {
        type: 'input',
        name: 'zip',
        message: 'Please enter your zip code:',
        validate: input => {
          if (!input) return 'Zip Required';
          return true;
        }
      }
    ];

    this.userAddress = {};
    this.validatedAddress = {};
    this.message = {};
    this.representativeAddress = {};
    this.init();
  }
  init() {
    this._printWelcome();
    this.getUserAddress();
  }
  _printWelcome() {
    console.log(`


  _         _                                                                                      
 | |       | |                                                                                     
 | |  ___  | |__                                                                                   
 | | / _ \\ | '_ \\                                                                                  
 | || (_) || |_) |                                                                                 
 |_| \\___/ |_.__/                                                                                  
  _    _   _____   _____                                            _          _    _              
 | |  | | / ____| |  __ \\                                          | |        | |  (_)             
 | |  | || (___   | |__) | ___  _ __   _ __  ___  ___   ___  _ __  | |_  __ _ | |_  _ __   __ ___  
 | |  | | \\___ \\  |  _  / / _ \\| '_ \\ | '__|/ _ \\/ __| / _ \\| '_ \\ | __|/ _\` || __|| |\\ \\ / // _ \\ 
 | |__| | ____) | | | \\ \\|  __/| |_) || |  |  __/\\__ \\|  __/| | | || |_| (_| || |_ | | \\ V /|  __/ 
  \\____/ |_____/ _|_|  \\_\\\\___|| .__/ |_|   \\___||___/ \\___||_| |_| \\__|\\__,_| \\__||_|  \\_/  \\___| 
 |  \\/  |       (_)| |         | |                                                                 
 | \\  / |  __ _  _ | |  ___  _ |_|                                                                 
 | |\\/| | / _\` || || | / _ \\| '__|                                                                 
 | |  | || (_| || || ||  __/| |                                                                    
 |_|  |_| \\__,_||_||_| \\___||_|                                                                    
                                                                                                   
                                                                                                   


`);
  }

  sendMessage() {
    lob.letters.create(
      {
        description: 'Letter to congress',
        to: this.representativeAddress,
        from: this.userAddress,
        file: '<html style="padding-top: 3in; margin: .5in;">{{message}}</html>',
        merge_variables: {
          message: this.message || 'Hello congress person!'
        },
        color: true
      },
      function(err, res) {
        if (err) {
          console.log(err);
        } else {
          console.log(`\nLetter created!  You can view your letter at:\n`);
          console.log(res.url, '\n');
        }
      }
    );
  }

  getUserAddress() {
    inquirer.prompt(this.addressPrompts).then(answers => {
      console.log(`\nYou entered: 
                ${answers.name}
                ${answers.line1} ${answers.line2}
                ${answers.city} ${answers.state} ${answers.zip}\n`);
      inquirer
        .prompt({
          type: 'confirm',
          name: 'addressConfirmation',
          message: 'Is the information correct?\n'
        })
        .then(answer => {
          if (answer.addressConfirmation) {
            this.userAddress = {
              name: answers.name,
              address_line1: answers.line1,
              address_line2: answers.line2,
              address_city: answers.city,
              address_state: answers.state,
              address_zip: answers.zip,
              address_country: 'US'
            };
            this._validateAddress(this._addressObjToValidatorObj(this.userAddress));
          } else {
            this.getUserAddress();
          }
        });
    });
  }

  getMessage() {
    inquirer
      .prompt({
        type: 'editor',
        name: 'message',
        message: '(500 character max)',
        validate: function(text) {
          if (text.length > 500) {
            return 'Must be under 500 characters.';
          }
          return true;
        }
      })
      .then(message => {
        this.message = message.message;
        this.sendMessage();
      });
  }

  _validateAddress(address) {
    addressValidator.validate(address, addressValidator.match.streetAddress, (err, exact, inexact) => {
      console.log('err: ', err);
      console.log('exact: ', exact);
      console.log('inexact: ', inexact);
      if (exact.length === 1) {
        inquirer
          .prompt([
            {
              type: 'confirm',
              name: 'addressConfirmation',
              message: `Google found: ` + exact.toString() + `.  Does this look correct?`
            }
          ])
          .then(confirmation => {
            if (confirmation.addressConfirmation) {
              this._validateObjToAddress(exact);
              this._getCongressPerson();
            } else {
              this.getUserAddress();
            }
          });
      } else {
        if (inexact.length === 1) {
          inquirer
            .prompt([
              {
                type: 'confirm',
                name: 'addressConfirmation',
                message: `Google found: ` + inexact[0].toString() + `.  Does this look correct?`
              }
            ])
            .then(confirmation => {
              if (confirmation.addressConfirmation) {
                this.validatedAddress = inexact[0].toString();
                this._validateObjToAddress(inexact[0]);
                this._getCongressPerson();
              } else {
                this.getUserAddress();
              }
            });
        } else {
          if (inexact.length === 0) {
            console.log(`Couldn't verify your address.  Please try again.`);
            this.getUserAddress();
          } else {
            let choices = inexact.map((address, index) => index + 1 + '. ' + address.toString());
            choices.push('None of these are correct');
            inquirer
              .prompt([
                {
                  type: 'list',
                  name: 'address',
                  message: 'Use which address?',
                  paginated: true,
                  choices: choices
                }
              ])
              .then(choice => {
                let index = parseInt(choice.address.split('.')[0]) - 1;
                if (choice.address === 'None of these are correct') {
                  console.log('OK, Please try again.');
                  this.getUserAddress();
                } else {
                  this._validateObjToAddress(inexact[index]);
                  this.validatedAddress = inexact[index].toString();
                  this._getCongressPerson();
                }
              });
          }
        }
      }
    });
  }
  _getCongressPerson() {
    axios
      .get('https://www.googleapis.com/civicinfo/v2/representatives', {
        params: {
          address: this.validatedAddress,
          key: GOOGLE_KEY,
          levels: 'country',
          roles: 'legislatorLowerBody'
        }
      })
      .then(reply => {
        if (reply.data.officials[0].name === 'Vacant') throw 'This seat is vacant.  Sorry!';
        this.representativeAddress = {
          name: reply.data.officials[0].name,
          address_line1: reply.data.officials[0].address[0].line1,
          address_line2: '',
          address_city: reply.data.officials[0].address[0].city,
          address_state: reply.data.officials[0].address[0].state,
          address_zip: reply.data.officials[0].address[0].zip,
          address_country: 'US'
        };
        console.log(`Your representative is ${this.representativeAddress.name}.  Send them a message!`);
        this.getMessage();
      })
      .catch(err => {
        console.log('error:', err);
      });
  }
  _addressObjToValidatorObj(addressObj) {
    return new addressValidator.Address({
      street: addressObj.address_line1,
      city: addressObj.address_city,
      state: addressObj.address_state,
      country: 'US'
    });
  }

  _validateObjToAddress(validated) {
    this.userAddress.address_line1 = validated.streetNumber + ' ' + validated.street;
    this.userAddress.address_city = validated.city;
    this.userAddress.address_state = validated.stateAbbr;
    this.userAddress.address_zip = validated.postalCode;
  }
}

let mailer = new lobMailer();
