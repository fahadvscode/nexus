import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, Search, Tag, FileText } from "lucide-react";
import { clientTags, clientStatuses, clientSources } from "@/types/client";

export interface FilterState {
  searchTerm: string;
  statusFilter: string;
  sourceFilter: string;
  selectedTags: string[];
  hasNotes: boolean | null;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableTags: string[];
}

export const AdvancedFilters = ({ filters, onFiltersChange, availableTags }: AdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleTagToggle = (tag: string) => {
    const updatedTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];
    updateFilters({ selectedTags: updatedTags });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: "",
      statusFilter: "all",
      sourceFilter: "all",
      selectedTags: [],
      hasNotes: null,
      dateRange: { from: null, to: null }
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.statusFilter !== "all") count++;
    if (filters.sourceFilter !== "all") count++;
    if (filters.selectedTags.length > 0) count++;
    if (filters.hasNotes !== null) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Get unique tags from all available tags and preset tags
  const allAvailableTags = [...new Set([...availableTags, ...clientTags])].sort();

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search clients, emails, tags, or notes..."
          value={filters.searchTerm}
          onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          className="pl-10 border-gray-200"
        />
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <select
          value={filters.statusFilter}
          onChange={(e) => updateFilters({ statusFilter: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm"
        >
          <option value="all">All Status</option>
          {clientStatuses.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        {/* Source Filter */}
        <select
          value={filters.sourceFilter}
          onChange={(e) => updateFilters({ sourceFilter: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm"
        >
          <option value="all">All Sources</option>
          {clientSources.map(source => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>

        {/* Advanced Filters Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Advanced
              {activeFilterCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 px-1.5 py-0.5 text-xs bg-blue-600 text-white"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                {activeFilterCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <Separator />

              {/* Tag Filters */}
              <div>
                <Label className="text-sm font-medium flex items-center space-x-2 mb-3">
                  <Tag className="h-4 w-4" />
                  <span>Filter by Tags</span>
                </Label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {allAvailableTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={filters.selectedTags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <Label
                        htmlFor={`tag-${tag}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notes Filter */}
              <div>
                <Label className="text-sm font-medium flex items-center space-x-2 mb-3">
                  <FileText className="h-4 w-4" />
                  <span>Notes Filter</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-notes"
                      checked={filters.hasNotes === true}
                      onCheckedChange={(checked) => 
                        updateFilters({ hasNotes: checked ? true : null })
                      }
                    />
                    <Label htmlFor="has-notes" className="text-sm cursor-pointer">
                      Has notes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no-notes"
                      checked={filters.hasNotes === false}
                      onCheckedChange={(checked) => 
                        updateFilters({ hasNotes: checked ? false : null })
                      }
                    />
                    <Label htmlFor="no-notes" className="text-sm cursor-pointer">
                      No notes
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.selectedTags.length > 0 || filters.hasNotes !== null) && (
        <div className="flex flex-wrap gap-2">
          {filters.selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-2 py-1 bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
              onClick={() => handleTagToggle(tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filters.hasNotes === true && (
            <Badge
              variant="secondary"
              className="px-2 py-1 bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
              onClick={() => updateFilters({ hasNotes: null })}
            >
              <FileText className="h-3 w-3 mr-1" />
              Has Notes
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.hasNotes === false && (
            <Badge
              variant="secondary"
              className="px-2 py-1 bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
              onClick={() => updateFilters({ hasNotes: null })}
            >
              <FileText className="h-3 w-3 mr-1" />
              No Notes
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}; 