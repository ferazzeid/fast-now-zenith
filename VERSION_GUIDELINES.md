# Version Management Guidelines

This document outlines our versioning strategy and workflow for Fast Now.

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/) with the format `MAJOR.MINOR.PATCH`:

- **MAJOR** (x.0.0): Breaking changes, major architectural updates
- **MINOR** (0.x.0): New features, model updates, significant improvements
- **PATCH** (0.0.x): Bug fixes, small improvements, security patches

## Version Increment Guidelines

### When to increment PATCH (0.0.x)
- Bug fixes and security patches
- Small UI improvements
- Performance optimizations
- Configuration updates
- Documentation fixes

### When to increment MINOR (0.x.0)
- New features and capabilities
- AI model updates or additions
- New admin tools or interfaces
- Database schema additions (non-breaking)
- New API endpoints
- Enhanced existing functionality

### When to increment MAJOR (x.0.0)
- Breaking API changes
- Major architectural overhauls
- Database schema breaking changes
- Removal of existing features
- Framework upgrades that affect compatibility
- Changes requiring user migration

## Version Management Workflow

### Using the Version Manager Script

```bash
# Patch release (bug fixes)
node scripts/version-manager.js patch "Fixed food entry validation bug"

# Minor release (new features)
node scripts/version-manager.js minor "Added dynamic AI model selection"

# Major release (breaking changes)
node scripts/version-manager.js major "Redesigned authentication system"
```

### Manual Process

1. **Before making changes**: Note current version
2. **During development**: Document changes in draft notes
3. **After completion**: Determine version type based on changes
4. **Update version**: Use version manager script or update manually
5. **Document changes**: Ensure CHANGELOG.md is updated
6. **Test thoroughly**: Verify all functionality works
7. **Commit and tag**: Create version commit and git tag

## File Locations

- **Version source**: `src/env.ts` (BUILD_INFO.version)
- **Changelog**: `CHANGELOG.md`
- **Version script**: `scripts/version-manager.js`
- **Service worker**: `scripts/sw-version-plugin.ts` (auto-syncs)

## Documentation Standards

Each version entry should include:

### Required Information
- **Date**: Release date in YYYY-MM-DD format
- **Version number**: Semantic version (e.g., 1.2.0)
- **Change categories**: Added, Changed, Deprecated, Removed, Fixed, Security
- **Description**: Clear, user-focused description of changes

### Technical Details (when applicable)
- Files modified or created
- Database migrations required
- Configuration changes needed
- Performance impact
- Breaking changes and migration notes

### Example Entry Format
```markdown
## [1.2.0] - 2024-12-19

### Added
- Dynamic AI model selection in admin dashboard
- Cost calculator for different models

### Changed
- Updated OpenAI integration to support multiple models
- Enhanced admin interface with model testing

### Technical Details
- Created AdminModelSelector component
- Updated edge functions for dynamic model resolution
- Added model-specific cost tracking

### Performance Impact
- Reduced API costs through model optimization
- Improved response times with model selection
```

## Git Workflow Integration

### Tagging Strategy
- Create git tags for all releases: `git tag v1.2.0`
- Use annotated tags with descriptions: `git tag -a v1.2.0 -m "Release v1.2.0"`
- Push tags to remote: `git push --tags`

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for new features
- **feature/**: Individual feature branches
- **hotfix/**: Emergency fixes for production

### Commit Message Format
```
type(scope): description

Examples:
feat(admin): add dynamic AI model selection
fix(auth): resolve session timeout issue
chore: bump version to 1.2.0
docs: update changelog for v1.2.0
```

## Release Checklist

### Pre-Release
- [ ] All tests passing
- [ ] Code review completed
- [ ] Version number determined
- [ ] CHANGELOG.md updated
- [ ] Performance impact assessed
- [ ] Breaking changes documented

### Release Process
- [ ] Update version in src/env.ts
- [ ] Run version manager script
- [ ] Commit version changes
- [ ] Create and push git tag
- [ ] Deploy to staging environment
- [ ] Verify functionality
- [ ] Deploy to production

### Post-Release
- [ ] Monitor for issues
- [ ] Update documentation if needed
- [ ] Communicate changes to team
- [ ] Plan next iteration

## Migration Notes

**Previous System**: Numeric versions (1-114)
**Current System**: Semantic versioning starting at 1.1.0
**Mapping**: Version 114 = v1.0.0, first dynamic model release = v1.1.0

This system ensures clear communication of changes, easier rollbacks, and better deployment planning.