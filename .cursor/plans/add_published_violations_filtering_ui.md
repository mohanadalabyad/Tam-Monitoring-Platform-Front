# Add Published Violations Filtering UI

## Overview

Add comprehensive filtering functionality to the published violations list on the public website. The component currently only has a simple category filter with client-side filtering. This plan will add server-side filtering using the backend API with filters for:
- Violation Type (Public/Private)
- City (dropdown)
- Category (dropdown)
- SubCategory (dropdown, dependent on category)
- Date Range (from/to dates)

## Changes Required

### 1. Update PublishedViolationFilter Model

**File:** `src/app/models/published-violation.model.ts`

**Changes:**
- Add `dateFrom` and `dateTo` fields to `PublishedViolationFilter`:
```typescript
export interface PublishedViolationFilter {
  violationType?: string; // "Public" or "Private"
  cityId?: number;
  categoryId?: number;
  subCategoryId?: number;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
}
```

### 2. Update Violation List Component TypeScript

**File:** `src/app/pages/publicwebsite/violation-list/violation-list.component.ts`

**Changes:**
- Import `FormBuilder`, `FormGroup`
- Import `CityService` and `SubCategoryService`
- Add form group for filters:
  - `violationType: [null]` (dropdown: "Public", "Private", "All")
  - `cityId: [null]` (dropdown)
  - `categoryId: [null]` (dropdown)
  - `subCategoryId: [null]` (dropdown, disabled until category selected)
  - `dateFrom: [null]` (date input)
  - `dateTo: [null]` (date input)

- Add properties:
  - `filterForm!: FormGroup`
  - `cities: CityDto[] = []`
  - `subCategories: SubCategoryDto[] = []`
  - `loadingCities = false`
  - `loadingSubCategories = false`
  - `showFilters = false` (toggle for filter section)

- Add methods:
  - `initFilterForm()` - Initialize reactive form
  - `loadCities()` - Load cities from CityService.getPublicLookup()
  - `loadSubCategories(categoryId)` - Load subcategories when category changes
  - `buildFilter()` - Build PublishedViolationFilter from form values with date formatting
  - `applyFilters()` - Call API with filter instead of client-side filtering
  - `resetFilters()` - Reset form and reload all violations
  - `onCategoryChange()` - Handle category selection to load subcategories

- Update `loadViolations()`:
  - Change from `getAllPublishedViolations()` to `getAllPublishedViolationsWithFilter()`
  - Use `buildFilter()` to create filter object
  - Handle date formatting (convert to ISO string format: `YYYY-MM-DDTHH:mm:ss`)

- Remove client-side `applyFilters()` method (replace with API call)
- Remove `categoryFilter` property (replaced by form control)

### 3. Update Violation List Component HTML

**File:** `src/app/pages/publicwebsite/violation-list/violation-list.component.html`

**Changes:**
- Replace simple category filter section with comprehensive filter section:
  - Add collapsible filter section with toggle
  - Add form with `[formGroup]="filterForm"`
  - Add violationType dropdown:
    ```html
    <select formControlName="violationType">
      <option [ngValue]="null">جميع الأنواع</option>
      <option value="Public">عام</option>
      <option value="Private">خاص</option>
    </select>
    ```
  - Add city dropdown (load from cities array)
  - Add category dropdown (existing categories array)
  - Add subcategory dropdown (load when category selected, disabled until category selected)
  - Add dateFrom date input: `<input type="date" formControlName="dateFrom">`
  - Add dateTo date input: `<input type="date" formControlName="dateTo">`
  - Add "Apply Filters" and "Reset" buttons

- Update filter section styling to match public website design
- Remove old simple category filter

### 4. Update Violation List Component SCSS

**File:** `src/app/pages/publicwebsite/violation-list/violation-list.component.scss`

**Changes:**
- Add styles for filter section:
  - Collapsible header with toggle icon
  - Form grid layout for filter inputs
  - Date input styling
  - Filter buttons styling
  - Responsive design for mobile

## Implementation Details

### Filter Form Structure

```typescript
filterForm = this.fb.group({
  violationType: [null], // "Public" | "Private" | null (all)
  cityId: [null],
  categoryId: [null],
  subCategoryId: [null],
  dateFrom: [null],
  dateTo: [null]
});
```

### Date Format Handling

- Convert date inputs to ISO string format for API:
  - `dateFrom`: Convert to `YYYY-MM-DDTHH:mm:ss` format (start of day: 00:00:00)
  - `dateTo`: Convert to `YYYY-MM-DDTHH:mm:ss` format (end of day: 23:59:59)

### Filter Building Logic

```typescript
buildFilter(): PublishedViolationFilter {
  const formValue = this.filterForm.value;
  const filter: PublishedViolationFilter = {};
  
  if (formValue.violationType) {
    filter.violationType = formValue.violationType;
  }
  if (formValue.cityId) {
    filter.cityId = Number(formValue.cityId);
  }
  if (formValue.categoryId) {
    filter.categoryId = Number(formValue.categoryId);
  }
  if (formValue.subCategoryId) {
    filter.subCategoryId = Number(formValue.subCategoryId);
  }
  if (formValue.dateFrom) {
    // Convert to ISO string with time (start of day)
    const date = new Date(formValue.dateFrom);
    date.setHours(0, 0, 0, 0);
    filter.dateFrom = date.toISOString();
  }
  if (formValue.dateTo) {
    // Convert to ISO string with time (end of day)
    const date = new Date(formValue.dateTo);
    date.setHours(23, 59, 59, 999);
    filter.dateTo = date.toISOString();
  }
  
  return filter;
}
```

### Subcategory Loading

- Watch `categoryId` form control changes using `valueChanges` subscription
- When category is selected, load subcategories for that category using `SubCategoryService.getPublicLookup(categoryId)`
- Clear subcategory selection when category changes
- Disable subcategory dropdown when no category is selected

### API Integration

- Replace `getAllPublishedViolations()` with `getAllPublishedViolationsWithFilter(filter)`
- Pass filter object built from form values
- Handle pagination if needed (currently using undefined for pageNumber/pageSize)
- Update `totalPublishedCount` from API response

## Testing Considerations

- Test filter by violation type (Public/Private)
- Test filter by city
- Test filter by category
- Test filter by subcategory (dependent on category)
- Test date range filtering (from/to)
- Test combination of multiple filters
- Test reset filters functionality
- Test that subcategories load when category is selected
- Test that subcategories are cleared when category changes
- Verify API payload matches expected format (violationType, cityId, categoryId, subCategoryId, dateFrom, dateTo)
- Test empty state when no violations match filters
- Test that filters persist or reset appropriately
