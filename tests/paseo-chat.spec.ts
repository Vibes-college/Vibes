import { registerMockOperationTests } from './fixtures/paseo-webui/mock-operations.ts';
import { registerMockSelectionTests } from './fixtures/paseo-webui/mock-chat-selection.ts';
import { registerArticleReferenceTests } from './fixtures/paseo-webui/article-reference.ts';
import { registerDefaultDirectoryTests } from './fixtures/paseo-webui/default-directory.ts';

registerMockOperationTests();
registerMockSelectionTests();
registerArticleReferenceTests();
registerDefaultDirectoryTests();
