import type {
  DotnetSdkFloatingRange,
  DotnetSdkRange,
  DotnetSdkVersion,
} from './types';
import { compare, versionToString } from './version';

export function getFloatingRangeLowerBound(
  range: DotnetSdkFloatingRange,
): DotnetSdkVersion {
  const { major, minor = 0, patch = 0, prerelease } = range;
  const res: DotnetSdkVersion = {
    type: 'dotnet-sdk-version',
    major,
    minor,
    patch,
  };

  if (prerelease) {
    res.prerelease = prerelease;
  }

  return res;
}

export function matches(v: DotnetSdkVersion, r: DotnetSdkRange): boolean {
  if (r.type === 'dotnet-sdk-exact-range') {
    return compare(v, r.version) === 0;
  }

  if (!r.prerelease && v.prerelease) {
    return false;
  }

  const lowerBound = getFloatingRangeLowerBound(r);
  return compare(v, lowerBound) >= 0;
}

export function coerceFloatingComponent(component: number | undefined): number {
  return component ? Math.floor(component / 10) * 10 : 0;
}

export function rangeToString(range: DotnetSdkRange): string {
  if (range.type === 'dotnet-sdk-exact-range') {
    return versionToString(range.version);
  }

  const { major, minor, patch, floating } = range;

  if (floating === 'major') {
    return `${major}.x`;
  }

  if (floating === 'minor') {
    return `${major}.${minor ?? 0}.x`;
  }

  const featureBand = (patch ?? 100) / 100;

  return `${major}.${minor ?? 0}.${featureBand}xx`;
}

export function tryBump(
  r: DotnetSdkRange,
  v: DotnetSdkVersion,
  x: string,
): string {
  return matches(v, r) ? rangeToString(r) : x;
}
