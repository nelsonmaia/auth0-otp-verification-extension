const defaultTemplate = require('./utils/defaultTemplate');
const getStorage = require('../lib/db').get;

const buildAuth0Widget = require('./utils/auth0widget');
const buildExtensionScripts = require('./utils/extensionScripts');
const googlePhone = require("google-libphonenumber");


const VAR_REGEX = /\{\{\s*(.*?)\s*\}\}/g;
const render = (template, locals = {}) => {
  if (!template || typeof template !== 'string') {
    throw new Error('Invalid template provided');
  }

  return template.replace(VAR_REGEX, (match, name) => locals[name] || '');
};

module.exports = ({
  stylesheetTag, customCSSTag, currentUser, matchingUsers, dynamicSettings, identities, locale
}) =>
  Promise.all([buildAuth0Widget(dynamicSettings, identities, locale), getStorage().read()])
    .then(([widget, data]) => {
      const template = data.settings ? data.settings.template : defaultTemplate;

      console.log("it is inside template promise");

      currentUser.user_metadata = currentUser.user_metadata || {};
      currentUser.user_metadata.mobileNumber = currentUser.user_metadata.mobileNumber || "";

      if (currentUser.user_metadata.mobileNumber !== "") {

        const phoneUtil = googlePhone.PhoneNumberUtil.getInstance();
        const PNF = googlePhone.PhoneNumberFormat;

        // number parsing may fail for local numbers as we don't specify a country code
        // this is a temporary fix that assumes "ZA" for all local phone numbers
        // the correct long term fix should be either:
        //  A. Force users to always specify the number in international format
        //  B. Ask user to input the country separately and use that when parsing the phone number
        let number = null;
        const rawNumber = currentUser.user_metadata.mobileNumber;
        try {
          number = phoneUtil.parseAndKeepRawInput(rawNumber);
        } catch (e) {
          console.log(`WARN: Phone number without country code: ${rawNumber}`);
          number = phoneUtil.parseAndKeepRawInput(rawNumber, 'ZA');
        }

        var formattedNumber = phoneUtil
          .format(number, PNF.NATIONAL)
          .replace(/[\+\ \-\(\)]/gi, "");

        var regionCode = phoneUtil.getRegionCodeForNumber(number);

        console.log(
          "Number format update " +
          currentUser.user_metadata.mobileNumber +
          " to " +
          formattedNumber +
          " country " +
          regionCode
        );

        currentUser.user_metadata.mobileNumber = formattedNumber;
        currentUser.user_metadata.mobileNumberCountry = regionCode;
      }

      return render(template, {
        ExtensionCSS: stylesheetTag,
        EmbeededCss: "buildExtensionCSS",
        CustomCSS: customCSSTag,
        Auth0Widget: widget,
        ExtensionScripts: buildExtensionScripts(currentUser, matchingUsers)
      });
    });
