import is from '@sindresorhus/is';
import handlebars, { type HelperOptions } from 'handlebars';
import { GlobalConfig } from '../../config/global';
import { logger } from '../../logger';
import { toArray } from '../array';
import { getChildEnv } from '../exec/utils';
import { regEx } from '../regex';

// Missing in handlebars
type Options = HelperOptions & {
  lookupProperty: (element: unknown, key: unknown) => unknown;
};

handlebars.registerHelper('encodeURIComponent', encodeURIComponent);
handlebars.registerHelper('decodeURIComponent', decodeURIComponent);

handlebars.registerHelper('encodeBase64', (str: string) =>
  Buffer.from(str ?? '').toString('base64'),
);

handlebars.registerHelper('decodeBase64', (str: string) =>
  Buffer.from(str ?? '', 'base64').toString(),
);

handlebars.registerHelper('stringToPrettyJSON', (input: string): string =>
  JSON.stringify(JSON.parse(input), null, 2),
);

handlebars.registerHelper('toJSON', (input: unknown): string =>
  JSON.stringify(input),
);

handlebars.registerHelper('toArray', (...args: unknown[]): unknown[] => {
  // Need to remove the 'options', as last parameter
  // https://handlebarsjs.com/api-reference/helpers.html
  args.pop();
  return args;
});

handlebars.registerHelper('toObject', (...args: unknown[]): unknown => {
  // Need to remove the 'options', as last parameter
  // https://handlebarsjs.com/api-reference/helpers.html
  args.pop();

  if (args.length % 2 !== 0) {
    throw new Error(`Must contain an even number of elements`);
  }

  const keys = args.filter((_, index) => index % 2 === 0);
  const values = args.filter((_, index) => index % 2 === 1);

  return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
});

handlebars.registerHelper('replace', (find, replace, context) =>
  (context ?? '').replace(regEx(find, 'g'), replace),
);

handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());

handlebars.registerHelper('containsString', (str, subStr) =>
  str?.includes(subStr),
);

handlebars.registerHelper('equals', (arg1, arg2) => arg1 === arg2);

handlebars.registerHelper('includes', (arg1: string[], arg2: string) => {
  if (is.array(arg1, is.string) && is.string(arg2)) {
    return arg1.includes(arg2);
  }

  return false;
});

handlebars.registerHelper(
  'split',
  (str: unknown, separator: unknown): string[] => {
    if (is.string(str) && is.string(separator)) {
      return str.split(separator);
    }
    return [];
  },
);

handlebars.registerHelper({
  and(...args) {
    // Need to remove the 'options', as last parameter
    // https://handlebarsjs.com/api-reference/helpers.html
    args.pop();
    return args.every(Boolean);
  },
  or(...args) {
    // Need to remove the 'options', as last parameter
    // https://handlebarsjs.com/api-reference/helpers.html
    args.pop();
    return args.some(Boolean);
  },
});

handlebars.registerHelper(
  'lookupArray',
  (obj: unknown, key: unknown, options: Options): unknown[] => {
    return (
      toArray(obj)
        // skip elements like #with does
        .filter((element) => !handlebars.Utils.isEmpty(element))
        .map((element) => options.lookupProperty(element, key))
        .filter((value) => value !== undefined)
    );
  },
);

handlebars.registerHelper('distinct', (obj: unknown): unknown[] => {
  const seen = new Set<string>();

  return toArray(obj).filter((value) => {
    const str = JSON.stringify(value);

    if (seen.has(str)) {
      return false;
    }

    seen.add(str);
    return true;
  });
});

export const exposedConfigOptions = [
  'additionalBranchPrefix',
  'addLabels',
  'branchName',
  'branchPrefix',
  'branchTopic',
  'commitBody',
  'commitMessage',
  'commitMessageAction',
  'commitMessageExtra',
  'commitMessagePrefix',
  'commitMessageSuffix',
  'commitMessageTopic',
  'gitAuthor',
  'group',
  'groupName',
  'groupSlug',
  'labels',
  'prBodyColumns',
  'prBodyDefinitions',
  'prBodyNotes',
  'prTitle',
  'semanticCommitScope',
  'semanticCommitType',
  'separateMajorMinor',
  'separateMinorPatch',
  'separateMultipleMinor',
  'sourceDirectory',
];

export const allowedFields = {
  baseBranch: 'The baseBranch for this branch/PR',
  body: 'The body of the release notes',
  categories: 'The categories of the manager of the dependency being updated',
  currentValue: 'The extracted current value of the dependency being updated',
  currentVersion:
    'The version that would be currently installed. For example, if currentValue is ^3.0.0 then currentVersion might be 3.1.0.',
  currentVersionAgeInDays: 'The age of the current version in days',
  currentVersionTimestamp: 'The timestamp of the current version',
  currentDigest: 'The extracted current digest of the dependency being updated',
  currentDigestShort:
    'The extracted current short digest of the dependency being updated',
  datasource: 'The datasource used to look up the upgrade',
  depName: 'The name of the dependency being updated',
  depNameLinked:
    'The dependency name already linked to its home page using markdown',
  depNameSanitized:
    'The depName field sanitized for use in branches after removing spaces and special characters',
  depType: 'The dependency type (if extracted - manager-dependent)',
  depTypes:
    'A deduplicated array of dependency types (if extracted - manager-dependent) in a branch',
  displayFrom: 'The current value, formatted for display',
  displayPending: 'Latest pending update, if internalChecksFilter is in use',
  displayTo: 'The to value, formatted for display',
  hasReleaseNotes: 'true if the upgrade has release notes',
  indentation: 'The indentation of the dependency being updated',
  isGroup: 'true if the upgrade is part of a group',
  isLockfileUpdate: 'true if the branch is a lock file update',
  isMajor: 'true if the upgrade is major',
  isMinor: 'true if the upgrade is minor',
  isPatch: 'true if the upgrade is a patch upgrade',
  isPin: 'true if the upgrade is pinning dependencies',
  isPinDigest: 'true if the upgrade is pinning digests',
  isRollback: 'true if the upgrade is a rollback PR',
  isReplacement: 'true if the upgrade is a replacement',
  isRange: 'true if the new value is a range',
  isSingleVersion:
    'true if the upgrade is to a single version rather than a range',
  isVulnerabilityAlert: 'true if the upgrade is a vulnerability alert',
  logJSON: 'ChangeLogResult object for the upgrade',
  manager: 'The (package) manager which detected the dependency',
  newDigest: 'The new digest value',
  newDigestShort:
    'A shorted version of newDigest, for use when the full digest is too long to be conveniently displayed',
  newMajor:
    'The major version of the new version. e.g. "3" if the new version is "3.1.0"',
  newMinor:
    'The minor version of the new version. e.g. "1" if the new version is "3.1.0"',
  newPatch:
    'The patch version of the new version. e.g. "0" if the new version is "3.1.0"',
  newName:
    'The name of the new dependency that replaces the current deprecated dependency',
  newValue:
    'The new value in the upgrade. Can be a range or version e.g. "^3.0.0" or "3.1.0"',
  newVersion: 'The new version in the upgrade, e.g. "3.1.0"',
  newVersionAgeInDays: 'The age of the new version in days',
  packageFile: 'The filename that the dependency was found in',
  packageFileDir:
    'The directory with full path where the packageFile was found',
  packageName: 'The full name that was used to look up the dependency',
  packageScope: 'The scope of the package name. Supports Maven group ID only',
  parentDir:
    'The name of the directory that the dependency was found in, without full path',
  parentOrg: 'The name of the parent organization for the current repository',
  platform: 'VCS platform in use, e.g. "github", "gitlab", etc.',
  prettyDepType: 'Massaged depType',
  prettyNewMajor: 'The new major value with v prepended to it.',
  prettyNewVersion: 'The new version value with v prepended to it.',
  project: 'ChangeLogProject object',
  recreateClosed: 'If true, this PR will be recreated if closed',
  references: 'A list of references for the upgrade',
  releases: 'An array of releases for an upgrade',
  releaseNotes: 'A ChangeLogNotes object for the release',
  releaseTimestamp: 'The timestamp of the release',
  repository: 'The current repository',
  semanticPrefix: 'The fully generated semantic prefix for commit messages',
  sourceRepo: 'The repository in the sourceUrl, if present',
  sourceRepoName: 'The repository name in the sourceUrl, if present',
  sourceRepoOrg: 'The repository organization in the sourceUrl, if present',
  sourceRepoSlug: 'The slugified pathname of the sourceUrl, if present',
  sourceUrl: 'The source URL for the package',
  topLevelOrg:
    'The name of the top-level organization for the current repository',
  updateType:
    'One of digest, pin, rollback, patch, minor, major, replacement, pinDigest',
  upgrades: 'An array of upgrade objects in the branch',
  url: 'The url of the release notes',
  version: 'The version number of the changelog',
  versioning: 'The versioning scheme in use',
  versions: 'An array of ChangeLogRelease objects in the upgrade',
  vulnerabilitySeverity:
    'The severity for a vulnerability alert upgrade (LOW, MEDIUM, MODERATE, HIGH, CRITICAL, UNKNOWN)',
};

type CompileInput = Record<string, unknown>;

const allowedTemplateFields = new Set([
  ...Object.keys(allowedFields),
  ...exposedConfigOptions,
]);

class CompileInputProxyHandler implements ProxyHandler<CompileInput> {
  constructor(private warnVariables: Set<string>) {}

  get(target: CompileInput, prop: keyof CompileInput): unknown {
    if (prop === 'env') {
      return target[prop];
    }

    if (!allowedTemplateFields.has(prop)) {
      this.warnVariables.add(prop);
      return undefined;
    }

    const value = target[prop];

    if (prop === 'prBodyDefinitions') {
      // Expose all prBodyDefinitions.*
      return value;
    }

    if (is.array(value)) {
      return value.map((element) =>
        is.primitive(element)
          ? element
          : proxyCompileInput(element as CompileInput, this.warnVariables),
      );
    }

    if (is.plainObject(value)) {
      return proxyCompileInput(value, this.warnVariables);
    }

    return value;
  }
}

export function proxyCompileInput(
  input: CompileInput,
  warnVariables: Set<string>,
): CompileInput {
  return new Proxy<CompileInput>(
    input,
    new CompileInputProxyHandler(warnVariables),
  );
}

export function compile(
  template: string,
  input: CompileInput,
  filterFields = true,
): string {
  const env = getChildEnv({});
  const data = { ...GlobalConfig.get(), ...input, env };
  const warnVariables = new Set<string>();
  const filteredInput = filterFields
    ? proxyCompileInput(data, warnVariables)
    : data;

  logger.trace({ template, filteredInput }, 'Compiling template');
  const result = handlebars.compile(template)(filteredInput);

  if (warnVariables.size > 0) {
    logger.info(
      { varNames: Array.from(warnVariables), template },
      'Disallowed variable names in template',
    );
  }

  return result;
}

export function safeCompile(
  template: string,
  input: CompileInput,
  filterFields = true,
): string {
  try {
    return compile(template, input, filterFields);
  } catch (err) {
    logger.warn({ err, template }, 'Error compiling template');
    return '';
  }
}
