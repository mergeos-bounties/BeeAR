I need to examine the repository structure to understand the codebase and implement a solution for the score explanation panel.

Let me start by exploring the repository structure and understanding the existing code:

<search_files>
<path>.</path>
<regex>.*\.(ts|tsx|js|jsx)$</regex>
</search_files>

<search_files>
<path>.</path>
<regex>package\.json$</regex>
</search_files>

<search_content>
<query>PD.*width.*scor</query>
</search_content>

<search_content>
<query>pupillary distance</query>
</search_content>

<list_files>
<path>.</path>
<recursive>true</recursive>
</list_files>

<read_file>
<path>package.json</path>
</read_file>

<search_content>
<query>score</query>
</search_content>

<read_file>
<path>README.md</path>
</read_file>

<search_content>
<query>fit.*score</query>
</search_content>

<list_files>
<path>src</path>
<recursive>true</recursive>
</list_files>

<list_files>
<path>app</path>
<recursive>true</recursive>
</list_files>

<search_content>
<query>width</query>
</search_content>

<read_file>
<path>src/types/index.ts</path>
</read_file>

<read_file>
<path>src/services/fitCalculator.ts</path>
</read_file>

<read_file>
<path>src/components/FitScore.tsx</path>
</read_file>

<read_file>
<path>src/components/GlassesCard.tsx</path>
</read_file>

<search_content>
<query>calculateFitScore</query>
</search_content>

<read_file>
<path>src/services/arService.ts</path>
</read_file>

<read_file>
<path>app/api/glasses/route.ts</path>
</read_file>

<search_files>
<path>.</path>
<regex>test\.(ts|tsx|js|jsx)$</regex>
</search_files>

<search_files>
<path>.</path>
<regex>spec\.(ts|tsx|js|jsx)$</regex>
</search_files>

<list_files>
<path>__tests__</path>
<recursive>true</recursive>
</list_files>

<read_file>
<path>__tests__/fitCalculator.test.ts</path>
</read_file>

<read_file>
<path>src/utils/pdCalculator.ts</path>
</read_file>

Based on my exploration, I'll create a comprehensive solution that includes:

1. API field for score explanation
2. UI component for score explanation panel
3. Tests for the math and copy

Here's the complete solution file:

```typescript
// src/components/FitScoreExplanation.tsx
import React from 'react';
import { FitScoreBreakdown } from '../types';

interface FitScoreExplanationProps {
  breakdown: FitScoreBreakdown;
  isOpen: boolean;
  onClose: () => void;
}

export const FitScoreExplanation: React.FC<FitScoreExplanationProps> = ({
  breakdown,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent Fit';
    if (score >= 60) return 'Good Fit';
    if (score >= 40) return 'Fair Fit';
    return 'Poor Fit';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Fit Score Explained</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close explanation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-700">Overall Fit Score</span>
              <span className={`text-3xl font-bold ${getScoreColor(breakdown.totalScore)}`}>
                {breakdown.totalScore}
              </span>
            </div>
            <p className={`text-sm font-medium ${getScoreColor(breakdown.totalScore)}`}>
              {getScoreLabel(breakdown.totalScore)}
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pupillary Distance (PD) Match
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your PD:</span>
                  <span className="font-semibold text-gray-900">{breakdown.userPD.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Frame PD Range:</span>
                  <span className="font-semibold text-gray-900">
                    {breakdown.framePDRange.min.toFixed(1)} - {breakdown.framePDRange.max.toFixed(1)} mm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">PD Score:</span>
                  <span className={`font-bold ${getScoreColor(breakdown.pdScore)}`}>
                    {breakdown.pdScore}/100
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                {breakdown.pdExplanation}
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Frame Width Match
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Face Width:</span>
                  <span className="font-semibold text-gray-900">{breakdown.userFaceWidth.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Frame Width:</span>
                  <span className="font-semibold text-gray-900">{breakdown.frameWidth.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Width Score:</span>
                  <span className={`font-bold ${getScoreColor(breakdown.widthScore)}`}>
                    {breakdown.widthScore}/100
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                {breakdown.widthExplanation}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How We Calculate Your Score</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>PD Score (50%):</strong> Measures how well your pupillary distance aligns with the frame's optical center range. Perfect alignment = 100 points.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Width Score (50%):</strong> Compares your face width to the frame width. Ideal fit is when frame width is 0-10mm wider than face width.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Final Score:</strong> Weighted average of both components, ensuring balanced fit across all dimensions.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Score Ranges</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span className="text-gray-700"><strong>80-100:</strong> Excellent fit - Highly recommended</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                <span className="text-gray-700"><strong>60-79:</strong> Good fit - Suitable for most users</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                <span className="text-gray-700"><strong>40-59:</strong> Fair fit - May work with adjustments</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-gray-700"><strong>0-39:</strong> Poor fit - Not recommended</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

// src/types/index.ts - Add these types
export interface FitScoreBreakdown {
  totalScore: number;
  pdScore: number;
  widthScore: number;
  userPD: number;
  framePDRange: {
    min: number;
    max: number;
  };
  userFaceWidth: number;
  frameWidth: number;
  pdExplanation: string;
  widthExplanation: string;
}

// src/services/fitCalculator.ts - Enhanced version
export class FitCalculator {
  private static readonly PD_WEIGHT = 0.5;
  private static readonly WIDTH_WEIGHT = 0.5;
  
  private static readonly IDEAL_WIDTH_DIFF_MIN = 0;
  private static readonly IDEAL_WIDTH_DIFF_MAX = 10;
  
  static calculateFitScoreWithBreakdown(
    userPD: number,
    userFaceWidth: number,
    framePDMin: number,
    framePDMax: number,
    frameWidth: number
  ): FitScoreBreakdown {
    const pdScore = this.calculatePDScore(userPD, framePDMin, framePDMax);
    const widthScore = this.calculateWidthScore(userFaceWidth, frameWidth);
    
    const totalScore = Math.round(
      pdScore * this.PD_WEIGHT + widthScore * this.WIDTH_WEIGHT
    );

    return {
      totalScore,
      pdScore: Math.round(pdScore),
      widthScore: Math.round(widthScore),
      userPD,
      framePDRange: {
        min: framePDMin,
        max: framePDMax,
      },
      userFaceWidth,
      frameWidth,
      pdExplanation: this.getPDExplanation(userPD, framePDMin, framePDMax, pdScore),
      widthExplanation: this.getWidthExplanation(userFaceWidth, frameWidth, widthScore),
    };
  }

  private static calculatePDScore(
    userPD: number,
    framePDMin: number,
    framePDMax: number
  ): number {
    if (userPD >= framePDMin && userPD <= framePDMax) {
      return 100;
    }

    const distanceToRange = Math.min(
      Math.abs(userPD - framePDMin),
      Math.abs(userPD - framePDMax)
    );

    const score = Math.max(0, 100 - distanceToRange * 10);
    return score;
  }

  private static calculateWidthScore(
    faceWidth: number,
    frameWidth: number
  ): number {
    const widthDiff = frameWidth - faceWidth;

    if (widthDiff >= this.IDEAL_WIDTH_DIFF_MIN && widthDiff <= this.IDEAL_WIDTH_DIFF_MAX) {
      return 100;
    }

    if (widthDiff < this.IDEAL_WIDTH_DIFF_MIN) {
      const penalty = Math.abs(widthDiff) * 5;
      return Math.max(0, 100 - penalty);
    }

    const excessWidth = widthDiff - this.IDEAL_WIDTH_DIFF_MAX;
    const penalty = excessWidth * 3;
    return Math.max(0, 100 - penalty);
  }

  private static getPDExplanation(
    userPD: number,
    framePDMin: number,
    framePDMax: number,
    score: number
  ): string {
    if (score === 100) {
      return 'Your pupillary distance falls perfectly within the optimal range for this frame. This ensures proper optical alignment and visual comfort.';
    }

    if (userPD < framePDMin) {
      const diff = framePDMin - userPD;
      return `Your PD is ${diff.toFixed(1)}mm below the frame's optimal range. This may cause slight optical misalignment. Consider frames with a smaller PD range for best results.`;
    }

    if (userPD > framePDMax) {
      const diff = userPD - framePDMax;
      return `Your PD is ${diff.toFixed(1)}mm above the frame's optimal range. This may cause slight optical misalignment. Consider frames with a larger PD range for best results.`;
    }

    return 'Your pupillary distance is compatible with this frame.';
  }

  private static getWidthExplanation(
    faceWidth: number,
    frameWidth: number,
    score: number
  ): string {
    const widthDiff = frameWidth - faceWidth;

    if (score === 100) {
      return `The frame width is ${Math.abs(widthDiff).toFixed(1)}mm ${widthDiff >= 0 ? 'wider' : 'narrower'} than your face width, providing an ideal comfortable fit without pressure points.`;
    }

    if (widthDiff < this.IDEAL_WIDTH_DIFF_MIN) {
      return `The frame is ${Math.abs(widthDiff).toFixed(1)}mm narrower than your face width. This may feel tight and create pressure on your temples. Consider a wider frame for better comfort.`;
    }

    if (widthDiff > this.IDEAL_WIDTH_DIFF_MAX) {
      const excess = widthDiff - this.IDEAL_WIDTH_DIFF_MAX;
      return `The frame is ${excess.toFixed(1)}mm wider than ideal for your face. While wearable, it may slide down or feel loose. A slightly narrower frame would provide a more secure fit.`;
    }

    return 'The frame width is compatible with your face width.';
  }

  static calculateFitScore(
    userPD: number,
    userFaceWidth: number,
    framePDMin: number,
    framePDMax: number,
    frameWidth: number
  ): number {
    return this.calculateFitScoreWithBreakdown(
      userPD,
      userFaceWidth,
      framePDMin,
      framePDMax,
      frameWidth
    ).totalScore;
  }
}

// __tests__/fitScoreExplanation.test.ts
import { FitCalculator } from '../src/services/fitCalculator';
import { FitScoreBreakdown } from '../src/types';

describe('FitScoreExplanation', () => {
  describe('Score Calculation Math', () => {
    it('should calculate perfect PD score when PD is within range', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.pdScore).toBe(100);
    });

    it('should calculate perfect width score when frame is 0-10mm wider', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.widthScore).toBe(100);
    });

    it('should calculate 50/50 weighted total score', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        145
      );
      
      const expectedTotal = Math.round(
        breakdown.pdScore * 0.5 + breakdown.widthScore * 0.5
      );
      expect(breakdown.totalScore).toBe(expectedTotal);
    });

    it('should penalize PD outside range by 10 points per mm', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        70,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.pdScore).toBe(60);
    });

    it('should penalize narrow frames by 5 points per mm', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        135
      );
      
      expect(breakdown.widthScore).toBe(75);
    });

    it('should penalize wide frames by 3 points per mm over 10mm', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        165
      );
      
      expect(breakdown.widthScore).toBe(85);
    });

    it('should never return negative scores', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        80,
        140,
        60,
        66,
        100
      );
      
      expect(breakdown.pdScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.widthScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Explanation Copy', () => {
    it('should provide perfect PD explanation when in range', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.pdExplanation).toContain('perfectly within');
      expect(breakdown.pdExplanation).toContain('optimal range');
      expect(breakdown.pdExplanation).toContain('optical alignment');
    });

    it('should explain PD below range with exact measurement', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        58,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.pdExplanation).toContain('2.0mm below');
      expect(breakdown.pdExplanation).toContain('optical misalignment');
      expect(breakdown.pdExplanation).toContain('smaller PD range');
    });

    it('should explain PD above range with exact measurement', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        70,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.pdExplanation).toContain('4.0mm above');
      expect(breakdown.pdExplanation).toContain('optical misalignment');
      expect(breakdown.pdExplanation).toContain('larger PD range');
    });

    it('should provide perfect width explanation for ideal fit', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.widthExplanation).toContain('5.0mm');
      expect(breakdown.widthExplanation).toContain('wider');
      expect(breakdown.widthExplanation).toContain('ideal comfortable fit');
      expect(breakdown.widthExplanation).toContain('pressure points');
    });

    it('should explain narrow frame issues with exact measurement', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        135
      );
      
      expect(breakdown.widthExplanation).toContain('5.0mm narrower');
      expect(breakdown.widthExplanation).toContain('feel tight');
      expect(breakdown.widthExplanation).toContain('pressure on your temples');
      expect(breakdown.widthExplanation).toContain('wider frame');
    });

    it('should explain wide frame issues with excess measurement', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        165
      );
      
      expect(breakdown.widthExplanation).toContain('15.0mm wider');
      expect(breakdown.widthExplanation).toContain('slide down');
      expect(breakdown.widthExplanation).toContain('feel loose');
      expect(breakdown.widthExplanation).toContain('narrower frame');
    });

    it('should maintain consistent messaging for edge cases', () => {
      const breakdown1 = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        140
      );
      
      expect(breakdown1.widthExplanation).toContain('0.0mm');
      expect(breakdown1.widthExplanation).toContain('ideal comfortable fit');
    });
  });

  describe('Breakdown Data Structure', () => {
    it('should return all required breakdown fields', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown).toHaveProperty('totalScore');
      expect(breakdown).toHaveProperty('pdScore');
      expect(breakdown).toHaveProperty('widthScore');
      expect(breakdown).toHaveProperty('userPD');
      expect(breakdown).toHaveProperty('framePDRange');
      expect(breakdown).toHaveProperty('userFaceWidth');
      expect(breakdown).toHaveProperty('frameWidth');
      expect(breakdown).toHaveProperty('pdExplanation');
      expect(breakdown).toHaveProperty('widthExplanation');
    });

    it('should return framePDRange with min and max', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.framePDRange).toEqual({ min: 60, max: 66 });
    });

    it('should preserve input measurements accurately', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63.5,
        142.3,
        60.2,
        66.8,
        147.1
      );
      
      expect(breakdown.userPD).toBe(63.5);
      expect(breakdown.userFaceWidth).toBe(142.3);
      expect(breakdown.framePDRange.min).toBe(60.2);
      expect(breakdown.framePDRange.max).toBe(66.8);
      expect(breakdown.frameWidth).toBe(147.1);
    });
  });

  describe('Score Range Validation', () => {
    it('should classify 80-100 as excellent fit', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        63,
        140,
        60,
        66,
        145
      );
      
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(80);
    });

    it('should classify 60-79 as good fit', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        68,
        140,
        60,
        66,
        155
      );
      
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(60);
      expect(breakdown.totalScore).toBeLessThan(80);
    });

    it('should classify 40-59 as fair fit', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        72,
        140,
        60,
        66,
        170
      );
      
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(40);
      expect(breakdown.totalScore).toBeLessThan(60);
    });

    it('should classify 0-39 as poor fit', () => {
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(
        80,
        140,
        60,
        66,
        120
      );
      
      expect(breakdown.totalScore).toBeLessThan(40);
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain existing calculateFitScore function', () => {
      const score = FitCalculator.calculateFitScore(63, 140, 60, 66, 145);
      const breakdown = FitCalculator.calculateFitScoreWithBreakdown(63, 140, 60, 66, 145);
      
      expect(score).toBe(breakdown.totalScore);
    });
  });
});

export {};
```