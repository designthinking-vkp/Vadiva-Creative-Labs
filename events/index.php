<?php
/**
 * Vadiva Creative Labs — Events & Camps Portal
 * Automatically serves the main events page if requested as /events or /events/
 */
header('X-Robots-Tag: index, follow');
require_once __DIR__ . '/index.html';
