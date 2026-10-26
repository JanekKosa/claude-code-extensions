/**
 * Tests that every button of the real toolbar is valid (tests\helpers\button-validity.ts), against the settings
 * the toolbar really owns.
 */

import { toolbarButtons } from '../../src/buttons';
import { ownedSettings } from '../../src/settings/owned-settings';
import { describeButtonValidity } from '../helpers/button-validity';

describeButtonValidity('the toolbar', toolbarButtons, ownedSettings);
