import React from 'react';
import { SecureMaker } from './SecureMaker';

/** One screen for each address. Both show the same maker; the address decides which way it opens. */
export const SecureDocumentPage: React.FC = () => <SecureMaker initial="doc" />;
export const SecureFilePage: React.FC = () => <SecureMaker initial="file" />;
