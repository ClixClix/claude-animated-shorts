#!/usr/bin/env python3
"""Source-agnostic final-MP4 quality gate for all V2 series.

Only the final encoded MP4 is evidence. Technical passing is not artistic
approval or proof of music rights. No paid API requests and no re-rendering.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

BASELINE = {
    'reference': 'In This Town — The Door at 11:11 (visual/technical reference, November 2026; music rights unverified)',
    'reference_sha256': '78f621b454e84214f1d0b3e244e7cb9e44ae49b5c9f571c649560eb680179374',
    'video': {'width': 1080, 'height': 1920, 'fps': '30/1', 'codec': 'h264'},
    'audio': {'codec': 'aac', 'sample_rate': 48000, 'channels': 2,
              'reference_integrated_lufs': -16.46, 'reference_true_peak_dbtp': -1.80},
    'release_limits': {'integrated_lufs_min': -18.0, 'integrated_lufs_max': -14.0,
                       'true_peak_dbtp_max': -1.0},
}
REVIEW_CHECKS = {
    'picture': [
        'full_final_mp4_watched', 'mobile_hook_and_story_clear',
        'camera_moves_and_cuts_motivated', 'characters_act_and_contact_correctly',
        'world_continuity_and_floor_geometry_clean', 'captions_readable_and_anchored',
        'dark_scenes_readable_on_phone', 'no_visible_render_artifacts',
    ],
    'sound': [
        'voice_clear_and_timed', 'sfx_sync_and_comedic_impact',
        'music_level_and_ducking_work', 'no_unintended_silence_or_distortion',
    ],
    'rights': ['music_and_sfx_cleared_for_distribution', 'voice_artwork_and_assets_cleared'],
}


def run(args, *, check=False):
    p = subprocess.run(args, text=True, capture_output=True, errors='replace')
    if check and p.returncode:
        raise RuntimeError(f"Command failed ({p.returncode}): {' '.join(map(str,args))}\n{p.stderr[-3000:]}")
    return p


def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def detect_events(stderr, start_key, end_key):
    events = []
    starts = []
    for line in stderr.splitlines():
        if start_key in line:
            m = re.search(rf'{re.escape(start_key)}\s*:\s*([\d.]+)', line)
            if m:
                starts.append(float(m.group(1)))
        if end_key in line:
            m = re.search(rf'{re.escape(end_key)}\s*:\s*([\d.]+)', line)
            if m and starts:
                start = starts.pop(0)
                end = float(m.group(1))
                events.append({'start_s': round(start, 3), 'end_s': round(end, 3), 'duration_s': round(end-start, 3)})
    return events, [round(x, 3) for x in starts]


def analyze(video, expected_frames=None):
    errors, warnings = [], []
    info = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format',
                           '-of', 'json', str(video)], check=True).stdout)
    videos = [s for s in info.get('streams', []) if s.get('codec_type') == 'video']
    audios = [s for s in info.get('streams', []) if s.get('codec_type') == 'audio']
    if len(videos) != 1 or len(audios) != 1:
        errors.append('Final MP4 must have exactly one video and one audio stream.')
    v = videos[0] if videos else {}
    a = audios[0] if audios else {}
    duration = float(info['format']['duration'])
    if duration <= 0:
        errors.append('Invalid duration.')
    for key, expected in BASELINE['video'].items():
        actual = v.get('r_frame_rate') if key == 'fps' else v.get('codec_name' if key == 'codec' else key)
        if actual != expected:
            errors.append(f'Video {key}: expected {expected}, found {actual}.')
    for key, expected in BASELINE['audio'].items():
        if key.startswith('reference_'):
            continue
        actual = a.get('codec_name' if key == 'codec' else key)
        if key == 'sample_rate':
            actual = int(actual) if actual else None
        if actual != expected:
            errors.append(f'Audio {key}: expected {expected}, found {actual}.')
    frames = int(v.get('nb_frames') or 0)
    expected_frames = round(duration * 30)
    if frames and abs(frames - expected_frames) > 1:
        errors.append(f'Video frame count {frames} inconsistent with {duration:.3f}s at 30fps.')
    if not frames:
        warnings.append('No declared frame count; full decode was checked instead.')
    if expected_frames is not None:
        if frames and frames != expected_frames:
            errors.append(f'Final MP4 has {frames} frames; approved edit requires {expected_frames}.')
        if abs(duration - expected_frames/30) > 0.05:
            errors.append(f'Final MP4 duration {duration:.3f}s differs from approved edit {expected_frames/30:.3f}s.')
    else:
        warnings.append('No approved edit frame count supplied; completeness against the storyboard is unverified.')
    # Full decode both streams; FFmpeg must return success with -xerror.
    decode = run(['ffmpeg', '-nostdin', '-hide_banner', '-v', 'error', '-xerror',
                  '-i', str(video), '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-'])
    if decode.returncode:
        errors.append('Full video/audio decode failed: ' + decode.stderr[-1200:])
    # loudnorm is MEASUREMENT ONLY: the output of this filter is discarded.
    meter = run(['ffmpeg', '-nostdin', '-hide_banner', '-v', 'info', '-i', str(video),
                 '-map', '0:a:0', '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json',
                 '-f', 'null', '-'], check=True)
    match = re.search(r'\{\s*"input_i"\s*:\s*".*?".*?\}', meter.stderr, re.S)
    if not match:
        raise RuntimeError('FFmpeg did not return loudnorm measurement JSON.')
    loud = json.loads(match.group(0))
    lufs, peak = float(loud['input_i']), float(loud['input_tp'])
    limits = BASELINE['release_limits']
    if not (limits['integrated_lufs_min'] <= lufs <= limits['integrated_lufs_max']):
        errors.append(f'Integrated loudness {lufs:.2f} LUFS outside {limits["integrated_lufs_min"]} to {limits["integrated_lufs_max"]}.')
    if peak > limits['true_peak_dbtp_max'] + 0.01:
        errors.append(f'Encoded true peak {peak:.2f} dBTP exceeds {limits["true_peak_dbtp_max"]} dBTP ceiling.')
    # These detect review candidates, not artistic failures: intentional holds,
    # blackouts and dramatic silence can be legitimate.
    picture = run(['ffmpeg', '-nostdin', '-hide_banner', '-v', 'info', '-i', str(video),
                   '-an', '-vf', 'blackdetect=d=0.45:pix_th=0.02:pic_th=0.98,freezedetect=n=-60dB:d=0.8',
                   '-f', 'null', '-'], check=True)
    black, _ = detect_events(picture.stderr, 'black_start', 'black_end')
    frozen, _ = detect_events(picture.stderr, 'freeze_start', 'freeze_end')
    silent_log = run(['ffmpeg', '-nostdin', '-hide_banner', '-v', 'info', '-i', str(video),
                      '-map', '0:a:0', '-af', 'silencedetect=noise=-45dB:d=0.6',
                      '-f', 'null', '-'], check=True)
    silent, _ = detect_events(silent_log.stderr, 'silence_start', 'silence_end')
    for name, events in [('dark/black intervals', black), ('held/frozen intervals', frozen), ('quiet intervals', silent)]:
        if events:
            warnings.append(f'{len(events)} {name} detected; verify story intent in the final MP4.')
    return {
        'video_path': str(video.resolve()), 'video_sha256': sha256(video),
        'bytes': video.stat().st_size, 'duration_seconds': round(duration, 4),
        'video': {k: v.get(k) for k in ('codec_name','width','height','r_frame_rate','pix_fmt','nb_frames')},
        'audio': {k: a.get(k) for k in ('codec_name','sample_rate','channels')},
        'measured': {'integrated_lufs': lufs, 'true_peak_dbtp': peak, 'loudness_range_lu': float(loud['input_lra'])},
        'full_decode_passed': decode.returncode == 0,
        'review_candidates': {'black': black, 'frozen': frozen, 'silence': silent},
        'technical_errors': errors, 'warnings': warnings,
        'technical_passed': not errors,
    }


def review_template(video_hash):
    return {'video_sha256': video_hash, 'reviewer': '',
            'checks': {group: {item: False for item in items} for group, items in REVIEW_CHECKS.items()},
            'approved_for_release': False, 'notes': 'Review the actual final MP4 on a phone and headphones; clear all rights.'}


def evaluate_review(path, actual_hash):
    if not path.exists():
        return False, [f'Manual review missing: {path}']
    try:
        obj = json.loads(path.read_text(encoding='utf-8'))
    except (ValueError, OSError) as exc:
        return False, [f'Cannot read review JSON: {exc}']
    issues = []
    if obj.get('video_sha256') != actual_hash:
        issues.append('Review SHA-256 does not match final MP4 (stale review).')
    if not str(obj.get('reviewer','')).strip():
        issues.append('Reviewer name/initials not provided.')
    for group, items in REVIEW_CHECKS.items():
        for item in items:
            if obj.get('checks',{}).get(group,{}).get(item) is not True:
                issues.append(f'Not approved: {group}.{item}')
    if obj.get('approved_for_release') is not True:
        issues.append('Final release approval not given.')
    return not issues, issues


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('video', type=Path, help='Final encoded vertical MP4 (any episode/series)')
    p.add_argument('--series', choices=['what_if_cats','in_this_town','other'], default='other')
    p.add_argument('--out-dir', type=Path, help='Directory for JSON and Markdown QA reports')
    p.add_argument('--review', type=Path, help='Human review JSON (defaults to VIDEO.review.json)')
    p.add_argument('--expected-frames', type=int, help='Exact approved edit length in frames; required for release approval')
    p.add_argument('--init-review', action='store_true', help='Create an all-false review form, never overwrite one')
    p.add_argument('--require-approval', action='store_true', help='Exit nonzero unless technical and human release checks pass')
    args = p.parse_args()
    if args.expected_frames is not None and args.expected_frames < 1:
        p.error('--expected-frames must be positive')
    if not args.video.is_file():
        p.error(f'No such final MP4: {args.video}')
    out = args.out_dir or args.video.parent
    out.mkdir(parents=True, exist_ok=True)
    review_path = args.review or args.video.with_suffix('.review.json')
    try:
        result = analyze(args.video, args.expected_frames)
    except (RuntimeError, ValueError, OSError, KeyError) as exc:
        print(f'Cannot complete release QA: {exc}', file=sys.stderr)
        return 1
    if args.init_review and not review_path.exists():
        review_path.write_text(json.dumps(review_template(result['video_sha256']), indent=2)+'\n', encoding='utf-8')
    human_ok, human_issues = evaluate_review(review_path, result['video_sha256'])
    if args.expected_frames is None:
        human_ok = False
        human_issues.append('Approved edit frame count not supplied; use --expected-frames N.')
    result.update({'series': args.series, 'reference': BASELINE,
                   'review_file': str(review_path), 'human_approved': human_ok,
                   'human_issues': human_issues,
                   'status': ('BLOCKED_TECHNICAL' if not result['technical_passed'] else
                              'READY_FOR_RELEASE' if human_ok else 'NEEDS_CREATIVE_AND_RIGHTS_REVIEW')})
    base = args.video.stem
    json_path = out / (base+'.release-qa.json')
    md_path = out / (base+'.release-qa.md')
    json_path.write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    lines = [f'# Final episode QA — {args.video.name}', '', f"**Status:** {result['status']}",
             f"**Series:** {args.series}", f"**SHA-256:** `{result['video_sha256']}`", '',
             '## Technical checks',
             f"- Final MP4: {result['video']['width']}×{result['video']['height']} at {result['video']['r_frame_rate']}, {result['duration_seconds']} s",
             f"- Audio: {result['audio']['codec_name']}, {result['audio']['sample_rate']} Hz, {result['audio']['channels']} channels",
             f"- Integrated loudness: {result['measured']['integrated_lufs']} LUFS (target −16 ±2)",
             f"- True peak: {result['measured']['true_peak_dbtp']} dBTP (must be ≤ −1)",
             f"- Full decode: {'PASS' if result['full_decode_passed'] else 'FAIL'}",
             f"- Technical result: {'PASS' if result['technical_passed'] else 'FAIL'}", '',
             '## Blocking technical errors']
    lines += ['- '+x for x in result['technical_errors']] or ['- None']
    lines += ['', '## Visual/audio review candidates (not automatic failures)']
    lines += ['- '+x for x in result['warnings']] or ['- None']
    lines += ['', '## Human creative and rights approval']
    lines += ['- '+x for x in human_issues] or ['- All explicit review and rights checks approved for this exact file']
    lines += ['', 'Passing automated checks does not establish engaging acting, good storytelling, or music licensing. Do not publish without human approval.', '']
    md_path.write_text('\n'.join(lines), encoding='utf-8')
    print(json.dumps({'status': result['status'], 'technical_passed': result['technical_passed'],
                      'lufs': result['measured']['integrated_lufs'], 'true_peak_dbtp': result['measured']['true_peak_dbtp'],
                      'warnings': len(result['warnings']), 'json_report': str(json_path),
                      'markdown_report': str(md_path), 'review_file': str(review_path)}, indent=2))
    if not result['technical_passed']:
        return 1
    if args.require_approval and not human_ok:
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())