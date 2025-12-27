/**
 * Type guard utilities for runtime type checking
 * These functions provide safe type narrowing with proper runtime validation
 */

/**
 * Type guard to check if a value is an HTMLElement
 * @param element - The value to check
 * @returns true if the value is an HTMLElement
 */
export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

/**
 * Type guard to check if an event's relatedTarget is an HTMLElement
 * @param event - The event to check
 * @returns true if relatedTarget exists and is an HTMLElement
 */
export function hasHTMLRelatedTarget(
  event: React.FocusEvent | React.MouseEvent
): event is (React.FocusEvent | React.MouseEvent) & { relatedTarget: HTMLElement } {
  return event.relatedTarget !== null && isHTMLElement(event.relatedTarget);
}

/**
 * Safely queries for an element and checks if it's an HTMLElement
 * @param parent - The parent element to query from
 * @param selector - The CSS selector
 * @returns The element if found and is HTMLElement, null otherwise
 */
export function safeQuerySelector(
  parent: Element | Document,
  selector: string
): HTMLElement | null {
  const element = parent.querySelector(selector);
  return isHTMLElement(element) ? element : null;
}

/**
 * Type guard to check if a querySelector result is an HTMLElement
 * @param element - The element returned from querySelector
 * @returns true if the element is an HTMLElement (not null or undefined)
 */
export function isQueryResult(element: Element | null): element is HTMLElement {
  return element !== null && isHTMLElement(element);
}
