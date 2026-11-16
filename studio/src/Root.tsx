import {BoxEpisodeComposition} from './v2/episodes/in-this-town-02/Episode';
import {DoorPolishComposition} from './v2/episodes/door-at-1111-polish/Episode';
import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";

import { TurnaroundSheet, ExpressionSheet, CastSheet } from "./v2/cats/Sheets";

import { CafeShot } from "./v2/cafe/Cafe";

import { ALittleLight } from "./v2/animation/ALittleLight";

import { NarrationComposition } from "./v2/narration/NarratedPreview";
import {DoorEpisodeComposition} from "./v2/episodes/door-at-1111/Episode";
import { PolishComposition } from "./v2/polish/Polish";

// One <Composition> per short. Copy src/videos/bridge to src/videos/<name> and register it here.
export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="V2MochaSheet" component={TurnaroundSheet} defaultProps={{cat:"mocha" as const}} durationInFrames={1} fps={30} width={1800} height={1120} />
    <Composition id="V2EssieSheet" component={TurnaroundSheet} defaultProps={{cat:"essie" as const}} durationInFrames={1} fps={30} width={1800} height={1120} />
    <Composition id="V2LatteSheet" component={TurnaroundSheet} defaultProps={{cat:"latte" as const}} durationInFrames={1} fps={30} width={1800} height={1120} />
    <Composition id="V2ExpressionSheet" component={ExpressionSheet} durationInFrames={1} fps={30} width={2200} height={1340} />
    <Composition id="V2CastSheet" component={CastSheet} durationInFrames={1} fps={30} width={1800} height={1300} />
    <Composition id="V2CafeExterior" component={CafeShot} defaultProps={{shot:"exterior" as const}} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="V2CafeWide" component={CafeShot} defaultProps={{shot:"interior-wide" as const}} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="V2CafeCounter" component={CafeShot} defaultProps={{shot:"counter-interaction" as const}} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="V2CafeCloseup" component={CafeShot} defaultProps={{shot:"essie-closeup" as const}} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="InThisTownV2ALittleLight" component={ALittleLight} durationInFrames={240} fps={30} width={1080} height={1920} />
    <NarrationComposition />
    <PolishComposition />
    <DoorEpisodeComposition />
    <DoorPolishComposition />
    <BoxEpisodeComposition />
  </>
);
