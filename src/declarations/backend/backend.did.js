/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const idlService = IDL.Service({
  'ping' : IDL.Func([], [IDL.Text], ['query']),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  return IDL.Service({ 'ping' : IDL.Func([], [IDL.Text], ['query']) });
};

export const init = ({ IDL }) => { return []; };
