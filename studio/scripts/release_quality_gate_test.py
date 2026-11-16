"""Offline unit tests; run python scripts/release-quality-gate.test.py."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name('release_quality_gate.py')
spec = importlib.util.spec_from_file_location('release_quality_gate', MODULE)
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)


class QualityGateTests(unittest.TestCase):
    def test_review_defaults_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / 'review.json'
            path.write_text(json.dumps(qa.review_template('a'*64)))
            passed, reasons = qa.evaluate_review(path, 'a'*64)
            self.assertFalse(passed)
            self.assertTrue(any('picture.full_final_mp4_watched' in x for x in reasons))
            self.assertTrue(any('music_and_sfx_cleared' in x for x in reasons))

    def test_review_requires_matching_final_file_hash(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / 'review.json'
            review = qa.review_template('a'*64)
            review['reviewer'] = 'Reviewer'
            review['approved_for_release'] = True
            for checks in review['checks'].values():
                for key in checks:
                    checks[key] = True
            path.write_text(json.dumps(review))
            self.assertTrue(qa.evaluate_review(path, 'a'*64)[0])
            passed, issues = qa.evaluate_review(path, 'b'*64)
            self.assertFalse(passed)
            self.assertTrue(any('stale review' in x for x in issues))

    def test_review_rejects_one_unapproved_right(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / 'review.json'
            review = qa.review_template('a'*64)
            review['reviewer'] = 'Reviewer'
            review['approved_for_release'] = True
            for checks in review['checks'].values():
                for key in checks:
                    checks[key] = True
            review['checks']['rights']['music_and_sfx_cleared_for_distribution'] = False
            path.write_text(json.dumps(review))
            self.assertFalse(qa.evaluate_review(path, 'a'*64)[0])

    def test_event_detection(self):
        events, incomplete = qa.detect_events('black_start:1.0\nblack_end:2.25 black_duration:1.25', 'black_start', 'black_end')
        self.assertEqual(events, [{'start_s': 1.0, 'end_s': 2.25, 'duration_s': 1.25}])
        self.assertEqual(incomplete, [])


if __name__ == '__main__':
    unittest.main()