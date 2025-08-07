import type {
  DotnetSdkFloatingRange,
  DotnetSdkRange,
  DotnetSdkVersion,
} from './types';

export function getFloatingRangeLowerBound(
  range: DotnetSdkFloatingRange,
): DotnetSdkVersion {
  const { major, minor = 0, patch = 100, prerelease } = range;
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
  if (r.floating === 'major') {
    return v.major === r.major;
  } else if (r.floating === 'minor') {
    return v.major === r.major && (v.minor ?? 0) === (r.minor ?? 0);
  } else {
    return (
      v.major === r.major &&
      v.minor === r.minor &&
      Math.floor((v.patch ?? 100) / 100) === Math.floor((r.patch ?? 100) / 100)
    );
  }
}

export function coerceFloatingComponent(component: number | undefined): number {
  return component ? Math.floor(component / 10) * 10 : 0;
}

export function rangeToString(range: DotnetSdkRange): string {
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
