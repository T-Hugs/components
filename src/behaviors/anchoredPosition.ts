/**
 * Settings that customize how a floating element is positioned
 * with respect to an anchor element.
 */
export interface PositionSettings {
  /**
   * Determines if the floating element should be attempted to be placed "inside"
   * the anchor element, or "outside" of it. Using "inside" is useful for making
   * it appear that the anchor _contains_ the floating element, and it can be
   * used for implementing a dialog that is centered on the screen. The "outside"
   * value is more common and can be used for tooltips, popovers, menus, etc.
   */
  insideOrOutside?: 'inside' | 'outside'

  /**
   * Determines the _edge_ on the anchor element that the floating element will be
   * anchored to. If `insideOrOutside` is "inside", then "centered" may be used to
   * center the floating element in the X-direction (while align is used to position
   * it in the Y-direction).
   * Note: "centered" is only a valid value if `insideOrOutside` is "inside".
   */
  side?: 'top' | 'bottom' | 'right' | 'left' | 'centered'

  /**
   * Determines how the floating element should align with the anchor element. If
   * set to "first", the floating element's first edge will align with the anchor
   * element's first edge. If set to "center", the floating element will be
   * centered along the axis of the anchor edge. If set to "last", the floating
   * element's last edge will align with the anchor element's last edge.
   */
  align?: 'first' | 'center' | 'last'

  /**
   * The number of pixels between the anchor edge and the floating element.
   */
  anchorOffset?: number

  /**
   * An additional offset, in pixels, to move the floating element from
   * the aligning edge.
   */
  alignmentOffset?: number

  /**
   * If true, when the above settings result in rendering the floating element
   * wholly or partially off-screen, attempt to adjust the settings to prevent
   * this. First, attempt to "flip" the element to the opposite side. If that
   * doesn't work, try to move it to a perpendicular anchor edge. If that also
   * fails, try adjusting the offsets until it renders on screen, avoiding
   * covering up the anchor element.
   */
  preventScreenOverflow?: boolean
}

// Default settings to position a floating element
const positionDefaults: PositionSettings = {
  insideOrOutside: 'outside',
  side: 'bottom',
  align: 'first',
  anchorOffset: 10,
  alignmentOffset: 0,
  preventScreenOverflow: true
}

const oppositeSides = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
  centered: 'centered'
} as const

/**
 * Given a floating element and an anchor element, return window-based coordinates for the
 * top-left of the floating element in order to absolutely position it such that it appears
 * near the anchor element.
 *
 * @param floatingElement Element intended to be positioned near or within an anchor
 * @param anchorElement The element to serve as the position anchor
 * @param settings Settings to determine the rules for positioning the floating element
 * @returns {top: number, left: number} coordinates for the floating element
 */
export function getAnchoredPosition(
  floatingElement: Element,
  anchorElement: Element | DOMRect,
  settings: PositionSettings = {}
) {
  // Call a separate method for recursion help
  const result = _getAnchoredPosition(
    floatingElement,
    anchorElement,
    settings,
    settings.preventScreenOverflow ? ['flip', 'move', 'offset'] : []
  )
  return {top: result.top, left: result.left}
}

function _getAnchoredPosition(
  floatingElement: Element,
  anchorElement: Element | DOMRect,
  settings: PositionSettings = {},
  preventScreenOverflowStrategies: ('offset' | 'flip' | 'move')[] = []
): {top: number; left: number; outOfBounds?: true} {
  const defaultedSettings = {
    ...positionDefaults,
    ...settings
  } as Required<PositionSettings>
  const {insideOrOutside, side, align, anchorOffset, alignmentOffset} = defaultedSettings
  const preventScreenOverflow = [...preventScreenOverflowStrategies]

  if (align === 'center' && alignmentOffset !== 0) {
    console.warn("Using alignmentOffset with align='center' is not supported. alignmentOffset will be ignored.")
  }
  if (side === 'centered' && insideOrOutside !== 'inside') {
    throw new Error("Using side='centered' is only supported with insideOrOutside='inside'.")
  }
  const anchorRect = anchorElement instanceof Element ? anchorElement.getBoundingClientRect() : anchorElement
  const elementRect = floatingElement.getBoundingClientRect()

  let top: number | undefined = undefined
  let left: number | undefined = undefined

  if (insideOrOutside === 'outside') {
    if (side === 'top') {
      top = anchorRect.top - anchorOffset - elementRect.height
    } else if (side === 'bottom') {
      top = anchorRect.bottom + anchorOffset
    } else if (side === 'left') {
      left = anchorRect.left - anchorOffset - elementRect.width
    } else if (side === 'right') {
      left = anchorRect.right + anchorOffset
    }

    if (side === 'top' || side === 'bottom') {
      if (align === 'first') {
        left = anchorRect.left + alignmentOffset
      } else if (align === 'center') {
        left = anchorRect.left - (elementRect.width - anchorRect.width) / 2
      } else if (align === 'last') {
        left = anchorRect.right - elementRect.width - alignmentOffset
      }
    }

    if (side === 'left' || side === 'right') {
      if (align === 'first') {
        top = anchorRect.top + alignmentOffset
      } else if (align === 'center') {
        top = anchorRect.top - (elementRect.height - anchorRect.height) / 2
      } else if (align === 'last') {
        top = anchorRect.bottom - elementRect.height - alignmentOffset
      }
    }
  } else {
    if (side === 'top') {
      top = anchorRect.top + anchorOffset
    } else if (side === 'bottom') {
      top = anchorRect.bottom - anchorOffset - elementRect.height
    } else if (side === 'left') {
      left = anchorRect.left + anchorOffset
    } else if (side === 'right') {
      left = anchorRect.right - anchorOffset - elementRect.width
    } else if (side === 'centered') {
      left = (anchorRect.right + anchorRect.left) / 2 - elementRect.width / 2
    }

    if (side === 'top' || side === 'bottom') {
      if (align === 'first') {
        left = anchorRect.left + alignmentOffset
      } else if (align === 'center') {
        left = anchorRect.left - (elementRect.width - anchorRect.width) / 2
      } else if (align === 'last') {
        left = anchorRect.right - elementRect.width - alignmentOffset
      }
    }

    if (side === 'left' || side === 'right' || side === 'centered') {
      if (align === 'first') {
        top = anchorRect.top + alignmentOffset
      } else if (align === 'center') {
        top = anchorRect.top - (elementRect.height - anchorRect.height) / 2
      } else if (align === 'last') {
        top = anchorRect.bottom - elementRect.height - alignmentOffset
      }
    }
  }

  if (top === undefined || left === undefined) {
    throw new Error('Unknown bug with positioning.')
  }

  let result: {top: number; left: number; outOfBounds?: true} = {
    top,
    left
  }

  // Check to see if we are off-screen
  if (
    top < 0 ||
    top + elementRect.height > window.innerHeight ||
    left < 0 ||
    left + elementRect.width > window.innerWidth
  ) {
    // `preventScreenOverflow` contains several strategies for preventing screen
    // overflow. Shift the next one off the list and try it using recursion.
    const nextFitStrategy = preventScreenOverflow.shift()
    if (nextFitStrategy === 'flip') {
      // Try the opposite side
      const flipped = _getAnchoredPosition(
        floatingElement,
        anchorElement,
        {
          ...defaultedSettings,
          side: oppositeSides[side]
        },
        preventScreenOverflow
      )
      if (!flipped.outOfBounds) {
        return flipped
      }
    } else if (nextFitStrategy === 'move') {
      // Try an adjacent side, but if that doesn't work, use "flip" to try
      // the _other_ adjacent side.
      const nextSide = side === 'bottom' || side === 'top' ? 'left' : 'top'
      const moved = _getAnchoredPosition(
        floatingElement,
        anchorElement,
        {
          ...defaultedSettings,
          side: nextSide
        },
        ['flip', ...preventScreenOverflow]
      )
      if (!moved.outOfBounds) {
        return moved
      }
    } else if (nextFitStrategy === 'offset') {
      // Just nudge the top or left so that it stays on screen.
      // May cover up the anchor element. @todo Make this smarter.
      if (top < 0) {
        result.top = 0
      }
      if (left < 0) {
        result.left = 0
      }
      if (top + elementRect.height > window.innerHeight) {
        result.top = window.innerHeight - elementRect.height
      }
      if (left + elementRect.width > window.innerWidth) {
        result.left = window.innerWidth - elementRect.width
      }
    } else if (nextFitStrategy === undefined) {
      result.outOfBounds = true
    }
  }

  return result
}
